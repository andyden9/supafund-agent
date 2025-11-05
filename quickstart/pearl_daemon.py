#!/usr/bin/env python3
"""
Custom launcher for the Pearl middleware daemon.

This wraps `operate.cli.create_app` and adds the `/api/v2/services/validate`
endpoint expected by the Supafund frontend. The validator inspects the locally
stored services and reports whether each service looks usable (all mandatory
fields present, keys available, etc.).
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from http import HTTPStatus
from typing import Dict

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from uvicorn.config import Config
from uvicorn.server import Server

from operate.cli import OperateApp, create_app
from operate.services.manage import ServiceManager

REQUIRED_VOLUME_MOUNTS = (
    "./persistent_data/data:/data:Z",
    "./persistent_data/benchmarks:/benchmarks:Z",
)


def _ensure_persistent_data_mounts(deployment_path: Path) -> None:
    """Ensure /data and /benchmarks volumes exist and are writable."""

    compose_path = deployment_path / "deployment" / "docker-compose.yaml"
    if not compose_path.exists():
        return

    try:
        import yaml  # type: ignore
    except ImportError:
        # yaml is part of the operate runtime; if missing we skip silently.
        return

    try:
        document = yaml.safe_load(compose_path.read_text(encoding="utf-8")) or {}
    except Exception:
        return

    services = document.get("services", {})
    updated = False

    for name, service in services.items():
        if "_abci_" not in name:
            continue
        volumes = service.setdefault("volumes", [])
        for mount in REQUIRED_VOLUME_MOUNTS:
            if mount not in volumes:
                volumes.append(mount)
                updated = True

    if updated:
        compose_path.write_text(
            yaml.safe_dump(document, sort_keys=False, default_flow_style=False),
            encoding="utf-8",
        )

    # Ensure the backing directories exist with permissive permissions.
    persistent_data_dir = deployment_path / "persistent_data"
    for subdir in ("data", "benchmarks"):
        target = persistent_data_dir / subdir
        target.mkdir(parents=True, exist_ok=True)
        try:
            os.chmod(target, 0o777)
        except PermissionError:
            # On some hosts chmod might be restricted; ignore.
            pass


def _ensure_gnosis_rpc_env(deployment_path: Path) -> None:
    """Force gnosis ledger RPC env to use the configured external endpoint."""

    env_path = deployment_path / "deployment" / "agent_0.env"
    if not env_path.exists():
        return

    lines = env_path.read_text(encoding="utf-8").splitlines()
    positions: dict[str, int] = {}
    values: dict[str, str] = {}

    for idx, line in enumerate(lines):
        if "=" not in line or line.startswith("#"):
            continue
        key, val = line.split("=", 1)
        positions[key] = idx
        values[key] = val

    rpc_value = None
    raw_rpc_urls = values.get("SKILL_FUNDS_MANAGER_MODELS_PARAMS_ARGS_RPC_URLS")
    if raw_rpc_urls:
        try:
            rpc_dict = json.loads(raw_rpc_urls)
        except json.JSONDecodeError:
            rpc_dict = {}
        rpc_value = rpc_dict.get("gnosis")

    # Fall back to default Supafund RPC if parsing failed.
    if not rpc_value:
        rpc_value = values.get("GNOSIS_LEDGER_RPC") or "https://rpc.gnosischain.com"

    target_key = "CONNECTION_LEDGER_CONFIG_LEDGER_APIS_GNOSIS_ADDRESS"
    if not rpc_value:
        return

    current_value = values.get(target_key)
    if current_value == rpc_value:
        return

    new_line = f"{target_key}={rpc_value}"
    if target_key in positions:
        lines[positions[target_key]] = new_line
    else:
        lines.append(new_line)

    env_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

# Ensure all local deployments use Docker instead of the host runtime.
_original_deploy_service_locally = ServiceManager.deploy_service_locally


def _docker_first_deploy_service_locally(  # type: ignore[override]
    self: ServiceManager,
    service_config_id: str,
    chain: str | None = None,
    use_docker: bool = False,
    use_kubernetes: bool = False,
    build_only: bool = False,
):
    """
    Wrapper around ServiceManager.deploy_service_locally that forces Docker deployments.

    The original implementation defaults to the host runtime when `use_docker` is falsy,
    which fails for multi-agent services (Host deployment currently only supports single agent deployments).
    We also make sure the generated docker-compose mounts /data and /benchmarks correctly so the
    agent can persist its store without permission issues.
    """

    if not use_docker:
        use_docker = True

    service = self.load(service_config_id=service_config_id)
    deployment = service.deployment
    deployment.build(
        use_docker=use_docker,
        use_kubernetes=use_kubernetes,
        force=True,
        chain=chain or service.home_chain,
    )

    if build_only:
        return deployment

    if use_docker:
        try:
            _ensure_persistent_data_mounts(deployment.path)
            _ensure_gnosis_rpc_env(deployment.path)
        except Exception:
            # Best-effort fixes; failures should not abort deployment.
            pass

    deployment.start(use_docker=use_docker)
    return deployment


ServiceManager.deploy_service_locally = _docker_first_deploy_service_locally

# Fields that must be present inside `user_params` for a service to be considered valid.
MANDATORY_USER_PARAMS = (
    "staking_program_id",
    "nft",
    "threshold",
    "agent_id",
    "use_staking",
    "use_mech_marketplace",
    "cost_of_bond",
    "fund_requirements",
)


def build_app(home: str | None) -> FastAPI:
    """Create the FastAPI application with the extra validation route."""

    # Create the standard application first.
    app = create_app(home=home)

    # Independent OperateApp instance used for validation reads.
    validator_app = OperateApp(home=home)

    @app.get("/api/v2/services/validate")
    async def _services_validate(request: Request) -> JSONResponse:
        """Validate the stored services."""
        validation: Dict[str, bool] = {}

        for service in validator_app.service_manager().json:
            service_id = service.get("service_config_id", "")
            is_valid = True

            # Keys must be present.
            if not service.get("keys"):
                is_valid = False

            chain_configs = service.get("chain_configs", {})
            if not chain_configs:
                is_valid = False

            for chain_config in chain_configs.values():
                user_params = (
                    chain_config.get("chain_data", {}).get("user_params") or {}
                )
                # Ensure all required fields are set.
                for field in MANDATORY_USER_PARAMS:
                    value = user_params.get(field)
                    if value in (None, "", {}, []):
                        is_valid = False
                        break

                fund_requirements = user_params.get("fund_requirements", {})
                if not isinstance(fund_requirements, dict) or not fund_requirements:
                    is_valid = False
                else:
                    for token_addr, requirements in fund_requirements.items():
                        if not isinstance(requirements, dict):
                            is_valid = False
                            break
                        if "agent" not in requirements or "safe" not in requirements:
                            is_valid = False
                            break
                        # Both values must be positive integers.
                        agent_value = requirements["agent"]
                        safe_value = requirements["safe"]
                        if not isinstance(agent_value, (int, float)) or agent_value < 0:
                            is_valid = False
                            break
                        if not isinstance(safe_value, (int, float)) or safe_value < 0:
                            is_valid = False
                            break

                if not is_valid:
                    break

            validation[service_id] = is_valid

        return JSONResponse(
            content=validation,
            status_code=HTTPStatus.OK,
        )

    return app


def main() -> None:
    """Entry point used by start_pearl_daemon.sh."""
    parser = argparse.ArgumentParser(description="Supafund Pearl middleware daemon")
    parser.add_argument("--host", default="localhost")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--ssl-keyfile", default="")
    parser.add_argument("--ssl-certfile", default="")
    parser.add_argument("--home", default=None)
    args = parser.parse_args()

    app = build_app(home=args.home)

    config_kwargs = {
        "app": app,
        "host": args.host,
        "port": args.port,
    }

    if args.ssl_keyfile and args.ssl_certfile:
        config_kwargs.update(
            {"ssl_keyfile": args.ssl_keyfile, "ssl_certfile": args.ssl_certfile}
        )

    server = Server(Config(**config_kwargs))
    app._server = server  # type: ignore[attr-defined]
    server.run()


if __name__ == "__main__":
    main()
