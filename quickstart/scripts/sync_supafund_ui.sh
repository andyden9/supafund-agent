#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATIC_SRC="${ROOT_DIR}/supafund-trader/packages/valory/skills/trader_abci/predict-ui-build"

if [ ! -d "${STATIC_SRC}" ]; then
  echo "❌ 未找到 Supafund 静态资源目录：${STATIC_SRC}"
  exit 1
fi

sync_one_compose() {
  local compose_file="$1"
  if [ ! -f "${compose_file}" ]; then
    return
  fi

  local deploy_dir
  deploy_dir="$(cd "$(dirname "${compose_file}")" && pwd)"
  local static_dst="${deploy_dir}/predict-ui-build"

  rm -rf "${static_dst}"
  mkdir -p "${static_dst}"
  cp -R "${STATIC_SRC}/." "${static_dst}/"

  python - <<'PY' "${compose_file}"
import sys
from pathlib import Path

compose_path = Path(sys.argv[1])
text = compose_path.read_text().splitlines()
volume_line = "    - ./predict-ui-build:/home/agent/vendor/valory/skills/trader_abci/predict-ui-build:Z"

if volume_line not in text:
    insert_after = "- ./agent_keys/agent_0:/agent_key:Z"
    for idx, line in enumerate(text):
        if line.strip() == insert_after:
            text.insert(idx + 1, volume_line)
            break
    else:
        text.append(volume_line)
    compose_path.write_text("\n".join(text) + "\n")
PY

  local container_name
  container_name="$(
    python - <<'PY' "${compose_file}"
import sys
from pathlib import Path

compose_path = Path(sys.argv[1])
container_name = ""
current_container = ""
is_supafund = False

for raw_line in compose_path.read_text().splitlines():
    stripped = raw_line.strip()
    if not stripped:
        continue

    if not raw_line.startswith(" "):
        if is_supafund and current_container:
            container_name = current_container
            break
        current_container = ""
        is_supafund = False
        continue

    if stripped.startswith("container_name:"):
        current_container = stripped.split(":", 1)[1].strip().strip("'\"")
        if is_supafund:
            container_name = current_container
            break
        continue

    if stripped.startswith("image:") and "supafund/oar-trader" in stripped:
        is_supafund = True
        if current_container:
            container_name = current_container
            break

if not container_name and is_supafund and current_container:
    container_name = current_container

print(container_name)
PY
  )"

  if [ -n "${container_name}" ]; then
    if docker ps --format '{{.Names}}' | grep -Fxq "${container_name}"; then
      local target_path="/home/agent/vendor/valory/skills/trader_abci/predict-ui-build"
      echo "同步最新 Supafund UI 到容器 ${container_name}..."
      docker exec "${container_name}" bash -c "rm -rf ${target_path}/*" >/dev/null 2>&1 || true
      docker cp "${static_dst}/." "${container_name}:${target_path}" >/dev/null 2>&1 || true
    fi
  fi
}

if [ "$#" -gt 0 ]; then
  for compose in "$@"; do
    sync_one_compose "${compose}"
  done
else
  find "${ROOT_DIR}/.operate/services" -path '*/deployment/docker-compose.yaml' -print | while read -r compose; do
    sync_one_compose "${compose}"
  done
fi
