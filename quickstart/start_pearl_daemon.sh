#!/bin/bash

# ==============================================================================
# Pearl Middleware Daemon Startup Script
# ==============================================================================
#
# This script starts the Pearl middleware daemon using the olas-operate-middleware
# from the olas3 project directory.
#
# The daemon provides REST API endpoints that the Pearl frontend can connect to
# for managing Supafund agent services.
#
# Usage:
#   ./start_pearl_daemon.sh
#
# Requirements:
#   - Poetry installed
#   - olas-operate-middleware properly set up in directory
#
# ==============================================================================

set -e  # Exit on error

echo "════════════════════════════════════════════════════════════"
echo "  Starting Pearl Middleware Daemon for Supafund Integration"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check if poetry is installed
if ! command -v poetry &> /dev/null; then
    echo "❌ Error: Poetry is not installed!"
    echo "   Please install poetry: https://python-poetry.org/docs/#installation"
    exit 1
fi

# Set environment variables for CORS (development mode)
export OPERATE_ENABLE_CORS="true"
export OPERATE_CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"

# Set Docker socket (macOS specific)
export DOCKER_HOST=unix:///Users/andydeng/.docker/run/docker.sock

echo "Configuration:"
echo "  - Daemon port: 8000"
echo "  - CORS enabled: yes (for localhost:3000)"
echo "  - Docker socket: $DOCKER_HOST"
echo ""

# Constrain packaging to remain compatible with open-aea.
PACKAGING_CONSTRAINT_FILE=$(mktemp 2>/dev/null)
if [ -n "$PACKAGING_CONSTRAINT_FILE" ]; then
    echo "packaging<24.0" > "$PACKAGING_CONSTRAINT_FILE"
    export PIP_CONSTRAINT="$PACKAGING_CONSTRAINT_FILE"
fi

cleanup() {
    if [ -n "$PACKAGING_CONSTRAINT_FILE" ]; then
        rm -f "$PACKAGING_CONSTRAINT_FILE"
        unset PIP_CONSTRAINT
    fi
}
trap cleanup EXIT

# Auto-heal potentially migrated service configs missing required fields.
python3 <<'PY' 2>/dev/null || poetry run python <<'PY'
from pathlib import Path
import json

base = Path(".operate/services")
if not base.is_dir():
    raise SystemExit(0)

for path in base.iterdir():
    if not path.is_dir():
        continue
    if "sc-" not in path.name and not path.name.startswith("invalid_"):
        continue

    config_path = path / "config.json"
    keys_path = path / "keys.json"
    if not config_path.exists():
        continue

    updated = False
    config = json.loads(config_path.read_text())

    if config.get("version", 0) > 7:
        config["version"] = 7
        updated = True

    if "keys" not in config and keys_path.exists():
        config["keys"] = json.loads(keys_path.read_text())
        updated = True

    for chain_cfg in config.get("chain_configs", {}).values():
        user_params = chain_cfg.get("chain_data", {}).get("user_params")
        if not isinstance(user_params, dict):
            continue
        if "threshold" not in user_params:
            user_params["threshold"] = 1
            updated = True
        if "use_staking" not in user_params:
            user_params["use_staking"] = True
            updated = True
        if "use_mech_marketplace" not in user_params:
            env_val = (
                config.get("env_variables", {})
                .get("USE_MECH_MARKETPLACE", {})
                .get("value", "")
            )
            user_params["use_mech_marketplace"] = str(env_val).lower() in ("true", "1")
            updated = True

    if updated:
        config_path.write_text(json.dumps(config, indent=2))
PY

# Rename any invalid service folders back to their expected name.
python3 <<'PY' 2>/dev/null || poetry run python <<'PY'
from pathlib import Path
import re

base = Path(".operate/services")
pattern = re.compile(r"invalid_\d+_(sc-[\\w-]+)")

for path in base.glob("invalid_*"):
    match = pattern.match(path.name)
    if not match:
        continue
    target_name = match.group(1)
    target_path = base / target_name
    if target_path.exists():
        continue
    path.rename(target_path)
PY

echo "🚀 Starting Pearl middleware daemon..."
echo "   API will be available at: http://localhost:8000/api"
echo "   Press Ctrl+C to stop the daemon"
echo ""

# Start the daemon using the patched entry point
poetry run python pearl_daemon.py --host localhost --port 8000

# This line will only be reached if the daemon exits
echo ""
echo "✅ Daemon stopped"
