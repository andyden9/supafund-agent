"""
Runtime patches for Supafund quickstart.

Placed under PYTHONPATH so it is auto-imported (via Python's sitecustomize hook)
before the Olas quickstart CLI starts. This lets us fix upstream issues without
modifying the vendored operate/autonomy packages inside the virtualenv.
"""

from __future__ import annotations

from typing import Dict


def _ensure_extra_volumes_mapping() -> None:
    """Coerce legacy list-style `extra_volumes` into the mapping expected downstream."""

    try:
        from autonomy.deploy.generators.docker_compose import base
    except Exception:  # pragma: no cover - defensive guard only
        return

    original = base.build_agent_config

    def patched_build_agent_config(*args, **kwargs):
        extra_volumes = kwargs.get("extra_volumes")

        if isinstance(extra_volumes, list):
            converted: Dict[str, str] = {}
            for entry in extra_volumes:
                if not isinstance(entry, str):
                    continue
                parts = entry.split(":")
                if len(parts) < 2:
                    continue
                host = ":".join(parts[:-1]).strip()
                container = parts[-1].strip()
                if host and container:
                    converted[host] = container
            kwargs["extra_volumes"] = converted or None
        elif isinstance(extra_volumes, dict):
            # normalize keys/values to avoid accidental whitespace mismatches
            kwargs["extra_volumes"] = {
                str(host).strip(): str(container).strip()
                for host, container in extra_volumes.items()
                if str(host).strip() and str(container).strip()
            }

        return original(*args, **kwargs)

    base.build_agent_config = patched_build_agent_config


_ensure_extra_volumes_mapping()

