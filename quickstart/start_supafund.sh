#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_PATH="${ROOT_DIR}/configs/config_supafund.json"
BACKEND_HOST="${BACKEND_HOST:-0.0.0.0}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
BACKEND_PID=""

is_backend_healthy() {
  poetry run python - <<'PY' "${BACKEND_HOST}" "${BACKEND_PORT}"
import socket
import sys

host = sys.argv[1]
port = int(sys.argv[2])
targets = [host]
if host in ("0.0.0.0", "::"):
    targets.append("127.0.0.1")
    targets.append("::1")

for target in targets:
    try:
        with socket.create_connection((target, port), timeout=0.5):
            sys.exit(0)
    except OSError:
        continue

sys.exit(1)
PY
}

wait_for_backend() {
  local retries=30
  while ! is_backend_healthy; do
    retries=$((retries - 1))
    if [ ${retries} -le 0 ]; then
      echo "❌ Supafund backend failed to become healthy on port ${BACKEND_PORT}."
      echo "   查看 .operate/supafund_backend.log 获取更多信息。"
      return 1
    fi
    sleep 1
  done
  return 0
}

stop_backend() {
  if [ -n "${BACKEND_PID}" ] && kill -0 "${BACKEND_PID}" >/dev/null 2>&1; then
    kill "${BACKEND_PID}" >/dev/null 2>&1 || true
    wait "${BACKEND_PID}" >/dev/null 2>&1 || true
  fi
}

start_backend() {
  if is_backend_healthy >/dev/null 2>&1; then
    echo "✅ 检测到已有 Supafund 后端在端口 ${BACKEND_PORT} 上运行，跳过启动。"
    return 0
  fi

  mkdir -p .operate
  local log_file=".operate/supafund_backend.log"
  echo "启动 Supafund 后端 (监听 ${BACKEND_HOST}:${BACKEND_PORT})…"
  poetry run python supafund_backend.py --host "${BACKEND_HOST}" --port "${BACKEND_PORT}" >"${log_file}" 2>&1 &
  BACKEND_PID=$!
  echo "${BACKEND_PID}" > .operate/supafund_backend.pid

  if ! wait_for_backend; then
    stop_backend
    return 1
  fi

  echo "Supafund 后端已启动。日志: ${log_file}"
  trap stop_backend EXIT
  return 0
}

ensure_docker_access() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "❌ Docker CLI not found. Please install and start Docker Desktop or Colima."
    exit 1
  fi

  local original_docker_host="${DOCKER_HOST:-}"
  local context_host
  context_host="$(docker context inspect "$(docker context show)" --format '{{ (index .Endpoints "docker").Host }}' 2>/dev/null || true)"
  if [ -n "${context_host}" ] && [ "${context_host}" != "null" ]; then
    export DOCKER_HOST="${context_host}"
  fi

  if docker info >/dev/null 2>&1; then
    return
  fi

  local fallback_original="${original_docker_host}"
  local sockets=(
    "/var/run/docker.sock"
    "${HOME}/.docker/run/docker.sock"
    "${HOME}/Library/Containers/com.docker.docker/Data/docker-cli.sock"
    "${HOME}/.colima/default/docker.sock"
  )

  for socket_path in "${sockets[@]}"; do
    if [ -S "${socket_path}" ]; then
      export DOCKER_HOST="unix://${socket_path}"
      if docker info >/dev/null 2>&1; then
        echo "✅ Detected Docker socket: ${socket_path}"
        echo ""
        return
      fi
    fi
  done

  if [ -n "${fallback_original}" ]; then
    export DOCKER_HOST="${fallback_original}"
  else
    unset DOCKER_HOST || true
  fi

  echo "❌ Unable to connect to the Docker daemon. Please start Docker Desktop or Colima."
  exit 1
}

ensure_supafund_image() {
  local target_image="supafund/oar-trader:bafybeicnqcdvfaox54q5dczwnx6shwrbvcezi3egy7urtaehi6csmd423y"
  local candidates=(
    "valory/oar-trader:bafybeicnqcdvfaox54q5dczwnx6shwrbvcezi3egy7urtaehi6csmd423y"
    "valory/oar-trader:bafybeicxhkpr3ro7osdhatltc2fo2df534o6y2mwkargi6a2vni4rwaqs4"
    "valory/oar-trader:bafybeicp7ve2jiy2n65nz3ounkehxl4w2zvhz4kztvzm3rl26r6746ctiu"
    "valory/oar-trader:0.1.0"
    "valory/oar-trader:latest"
  )

  if docker image inspect "${target_image}" >/dev/null 2>&1; then
    return
  fi

  local pulled_image=""
  for candidate in "${candidates[@]}"; do
    echo "Pulling ${candidate}..."
    if docker pull "${candidate}" >/dev/null 2>&1; then
      pulled_image="${candidate}"
      echo "  ↳ pulled ${candidate}"
      break
    else
      echo "  ↳ failed to pull ${candidate}"
    fi
  done

  if [ -z "${pulled_image}" ]; then
    cat <<'EOF'
❌ Unable to pull a compatible trader image automatically.
Please run:
  docker pull valory/oar-trader:<tag>        # e.g. bafybeicxhkpr3ro7osdhatltc2fo2df534o6y2mwkargi6a2vni4rwaqs4
  docker tag valory/oar-trader:<tag> supafund/oar-trader:bafybeicnqcdvfaox54q5dczwnx6shwrbvcezi3egy7urtaehi6csmd423y
Then rerun this script.
EOF
    exit 1
  fi

  echo "Tagging ${target_image}..."
  docker tag "${pulled_image}" "${target_image}"
  echo ""
}

cleanup_stale_networks() {
  local pattern="service_traderPdWj_localnet"
  local networks

  networks=$(docker network ls --format '{{.Name}}' | grep "${pattern}" || true)
  if [ -z "${networks}" ]; then
    return
  fi

  echo "Cleaning up stale Docker networks matching '${pattern}'..."
  while read -r network_name; do
    if [ -n "${network_name}" ]; then
      docker network rm "${network_name}" >/dev/null 2>&1 && \
        echo "  Removed network ${network_name}"
    fi
  done <<< "${networks}"
  echo ""
}

collect_compose_files() {
  local output_file="$1"
  if [ -d ".operate" ]; then
    find ".operate" -type f -name "docker-compose.yaml" | sort > "${output_file}"
  else
    : > "${output_file}"
  fi
}

post_process_deployment() {
  local compose_file="$1"
  if [ ! -f "${compose_file}" ]; then
    return
  fi

  local deploy_dir
  deploy_dir="$(cd "$(dirname "${compose_file}")" && pwd)"

  python - <<'PY' "${compose_file}"
import sys
from pathlib import Path

compose_path = Path(sys.argv[1])
text = compose_path.read_text()

if "volumes:\n" not in text:
    compose_path.write_text(text)
    sys.exit(0)

logs_variants = [
    "    - ./persistent_data/logs:/logs:Z",
    "    - ./persistent_data/logs:/logs",
]
data_variants = [
    "    - ./persistent_data/data:/data:Z",
    "    - ./persistent_data/data:/data",
]
bench_variants = [
    "    - ./persistent_data/benchmarks:/benchmarks:Z",
    "    - ./persistent_data/benchmarks:/benchmarks",
]

logs_entry = logs_variants[0]
data_entry = data_variants[0]
bench_entry = bench_variants[0]

def find_variant(source, variants):
    for variant in variants:
        if variant in source:
            return variant
    return None

logs_line = find_variant(text, logs_variants)
if logs_line is None:
    text = text.replace("volumes:\n", "volumes:\n" + logs_entry + "\n", 1)

logs_line = find_variant(text, logs_variants)

data_line = find_variant(text, data_variants)
if data_line is None and logs_line is not None:
    text = text.replace(logs_line, logs_line + "\n" + data_entry, 1)

logs_line = find_variant(text, logs_variants)
data_line = find_variant(text, data_variants)
bench_line = find_variant(text, bench_variants)

if bench_line is None:
    anchor = data_line if data_line is not None else logs_line
    if anchor is not None:
        text = text.replace(anchor, anchor + "\n" + bench_entry, 1)

compose_path.write_text(text)
PY

  bash "${ROOT_DIR}/scripts/sync_supafund_ui.sh" "${compose_file}"

  mkdir -p "${deploy_dir}/persistent_data/data" "${deploy_dir}/persistent_data/benchmarks"
  chmod 777 "${deploy_dir}/persistent_data/data" "${deploy_dir}/persistent_data/benchmarks"

  if [ -f "${deploy_dir}/agent_0.env" ]; then
    python - <<'PY' "${deploy_dir}/agent_0.env"
import sys
from pathlib import Path

path = Path(sys.argv[1])
text = path.read_text()
lines = text.splitlines()
index_map = {}
for idx, line in enumerate(lines):
    if "=" not in line:
        continue
    key, value = line.split("=", 1)
    index_map[key] = idx
    if key.endswith("STORE_PATH"):
        lines[idx] = f"{key}=/data"

slot_key = "SKILL_TRADER_ABCI_MODELS_PARAMS_ARGS_SLOT_COUNT"
if slot_key in index_map:
    lines[index_map[slot_key]] = f"{slot_key}=2"
else:
    lines.append(f"{slot_key}=2")

if "STORE_PATH" in index_map:
    lines[index_map["STORE_PATH"]] = "STORE_PATH=/data"
else:
    lines.append("STORE_PATH=/data")

    required_store_keys = [
        "SKILL_STAKING_ABCI_MODELS_PARAMS_ARGS_STORE_PATH",
        "SKILL_DECISION_MAKER_ABCI_MODELS_PARAMS_ARGS_STORE_PATH",
        "SKILL_AGENT_PERFORMANCE_SUMMARY_ABCI_MODELS_PARAMS_ARGS_STORE_PATH",
        "SKILL_MARKET_MANAGER_ABCI_MODELS_PARAMS_ARGS_STORE_PATH",
        "SKILL_FUNDS_MANAGER_MODELS_PARAMS_ARGS_STORE_PATH",
    ]

    for key in required_store_keys:
        if key in index_map:
            lines[index_map[key]] = f"{key}=/data"
        else:
            lines.append(f"{key}=/data")

    benchmark_keys = [
        "SKILL_TRADER_ABCI_MODELS_BENCHMARK_TOOL_ARGS_LOG_DIR",
    ]

    for key in benchmark_keys:
        if key in index_map:
            lines[index_map[key]] = f"{key}=/benchmarks"
        else:
            lines.append(f"{key}=/benchmarks")

patched = "\n".join(lines) + ("\n" if text.endswith("\n") else "")
path.write_text(patched)
PY
  fi
}

post_process_deployments_from_file() {
  local file="$1"
  if [ ! -f "${file}" ]; then
    return
  fi

  while IFS= read -r compose_file || [ -n "${compose_file}" ]; do
    [ -n "${compose_file}" ] || continue
    post_process_deployment "${compose_file}"
  done < "${file}"
}

echo "════════════════════════════════════════"
echo "  Supafund Quickstart"
echo "════════════════════════════════════════"
echo ""
echo "This script boots the Supafund agent via the Olas Quickstart CLI."
echo "Configuration file: ${CONFIG_PATH}"
echo ""

if [ ! -f "${CONFIG_PATH}" ]; then
  echo "❌ Unable to find ${CONFIG_PATH}. Please verify the repository layout."
  exit 1
fi

echo "Environment overview:"
echo "  SUPAFUND_API_ENDPOINT : ${SUPAFUND_API_ENDPOINT:-<not set>}"
echo "  SUPAFUND_WEIGHTS      : ${SUPAFUND_WEIGHTS:-<not set>}"
echo "  MIN_EDGE_THRESHOLD    : ${MIN_EDGE_THRESHOLD:-<not set>}"
echo "  RISK_TOLERANCE        : ${RISK_TOLERANCE:-<not set>}"
echo ""
echo "Tip: export the variables above beforehand if you want to skip interactive prompts."
echo ""

pushd "${ROOT_DIR}" >/dev/null 2>&1

ensure_docker_access
ensure_supafund_image
cleanup_stale_networks

export STORE_PATH="/logs"
export PYTHONPATH="${ROOT_DIR}/patches:${PYTHONPATH:-}"

before_compose="$(mktemp)"
collect_compose_files "${before_compose}"

echo "Installing dependencies with poetry…"
poetry install --only main --no-interaction --no-ansi

if ! start_backend; then
  echo "❌ 无法启动 Supafund 后端，请检查上述日志后重试。"
  exit 1
fi

echo ""
echo "Launching the Supafund service through Quickstart…"
echo "Press Ctrl+C at any time to stop the process."
echo ""

set +e
poetry run python -m operate.cli quickstart "${CONFIG_PATH}" "$@"
status=$?
set -e

after_compose="$(mktemp)"
collect_compose_files "${after_compose}"

post_process_deployments_from_file "${after_compose}"

rm -f "${before_compose}" "${after_compose}"

popd >/dev/null 2>&1

echo ""
echo "════════════════════════════════════════"
echo "  Supafund Quickstart command finished"
echo "════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  • Visit http://localhost:3000 to manage the service."
echo "  • Visit http://localhost:8716 for the embedded agent UI."

exit "${status}"
