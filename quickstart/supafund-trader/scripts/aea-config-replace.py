#!/usr/bin/env python3
"""Replace aea config params with env variables."""
from __future__ import annotations

import json
from pathlib import Path


AEA_CONFIG = Path("agent") / "aea-config.yaml"
ENV_PATH = Path(".env")


def load_env() -> dict[str, str]:
    """Load key=value lines from `.env`."""
    env: dict[str, str] = {}
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", maxsplit=1)
        env[key.strip()] = value.strip()
    return env


def replace_params(config: dict, env: dict[str, str]) -> dict:
    """Replace parameters in config with values from env."""

    def _replace(node):
        if isinstance(node, dict):
            return {k: _replace(v) for k, v in node.items()}
        if isinstance(node, list):
            return [_replace(v) for v in node]
        if isinstance(node, str) and node.startswith("${") and node.endswith("}"):
            inner = node[2:-1]
            key = inner.split(":", maxsplit=1)[0]
            return env.get(key, node)
        return node

    return _replace(config)


def main() -> None:
    env = load_env()
    data = json.loads(AEA_CONFIG.read_text(encoding="utf-8"))
    updated = replace_params(data, env)
    AEA_CONFIG.write_text(json.dumps(updated, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
