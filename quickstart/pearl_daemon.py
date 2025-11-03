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
from http import HTTPStatus
from typing import Dict

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from uvicorn.config import Config
from uvicorn.server import Server

from operate.cli import OperateApp, create_app

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
