#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="${ROOT_DIR}" # scripts run relative to quickstart root

default_host="0.0.0.0"
default_port="8000"

HOST="${HOST:-$default_host}"
PORT="${PORT:-$default_port}"

pushd "$ROOT_DIR" >/dev/null 2>&1

poetry run python supafund_backend.py --host "$HOST" --port "$PORT" "$@"

popd >/dev/null 2>&1
