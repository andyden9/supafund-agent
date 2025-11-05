#!/bin/bash

# Supafund Agent 启动脚本（新 repo）

echo "════════════════════════════════════════"
echo "  启动 Supafund Agent (V2 配置)"
echo "════════════════════════════════════════"
echo ""

# 设置 Docker socket（macOS）
export DOCKER_HOST=unix:///Users/andydeng/.docker/run/docker.sock

# 设置默认环境变量
export SUPAFUND_WEIGHTS="${SUPAFUND_WEIGHTS:-{\"founder_team\":20,\"market_opportunity\":20,\"technical_analysis\":20,\"social_sentiment\":20,\"tokenomics\":20}}"
export MIN_EDGE_THRESHOLD="${MIN_EDGE_THRESHOLD:-5}"
export RISK_TOLERANCE="${RISK_TOLERANCE:-5}"

echo "当前配置："
echo "  - 使用配置: configs/config_supafund.json"
echo "  - SUPAFUND_WEIGHTS: $SUPAFUND_WEIGHTS"
echo "  - SUPAFUND_API_ENDPOINT: ${SUPAFUND_API_ENDPOINT:-<未设置>}"
echo "  - MIN_EDGE_THRESHOLD: $MIN_EDGE_THRESHOLD"
echo "  - RISK_TOLERANCE: $RISK_TOLERANCE"
echo ""

if [ -z "$SUPAFUND_API_ENDPOINT" ]; then
    echo "⚠️  提示: 如果想避免每次输入，可以设置："
    echo "  export SUPAFUND_API_ENDPOINT=\"your_api_endpoint\""
    echo ""
fi

# 约束 packaging 版本，避免 open-aea 依赖冲突。
PACKAGING_CONSTRAINT_FILE=$(mktemp 2>/dev/null)
if [ -n "$PACKAGING_CONSTRAINT_FILE" ]; then
    echo "packaging<24.0" > "$PACKAGING_CONSTRAINT_FILE"
    export PIP_CONSTRAINT="$PACKAGING_CONSTRAINT_FILE"
fi

# 若缺少 .env，提供默认 STORE_PATH，避免容器内 /data 写权限问题
if [ ! -f ".env" ]; then
    cat <<'EOF' > .env
# Default store path used when not provided by the user.
# /tmp exists and is writable inside the docker image.
STORE_PATH=/tmp/
EOF
    echo "已生成 quickstart/.env（STORE_PATH=/tmp/）。如需自定义，请编辑该文件后重试。"
fi

# 启动服务
./run_service.sh configs/config_supafund.json
RUN_SERVICE_EXIT=$?

# 清理临时约束文件
if [ -n "$PACKAGING_CONSTRAINT_FILE" ]; then
    rm -f "$PACKAGING_CONSTRAINT_FILE"
    unset PIP_CONSTRAINT
fi

# 修复部署目录和卷挂载
SERVICE_ROOT=$(find .operate/services -maxdepth 1 -type d -name "sc-*" 2>/dev/null | head -1)
if [ -n "$SERVICE_ROOT" ]; then
    DEPLOY_DIR="$SERVICE_ROOT/deployment"
    DOCKER_COMPOSE_PATH="$DEPLOY_DIR/docker-compose.yaml"

    if [ -f "$DOCKER_COMPOSE_PATH" ]; then
        echo ""
        echo "检测并修复部署卷挂载..."

        mkdir -p "$SERVICE_ROOT/persistent_data/data" "$SERVICE_ROOT/persistent_data/benchmarks" "$SERVICE_ROOT/persistent_data/logs"
        chmod -R 777 "$SERVICE_ROOT/persistent_data/data" "$SERVICE_ROOT/persistent_data/benchmarks" >/dev/null 2>&1 || true

        export DOCKER_COMPOSE_PATH
        PYTHON_FIX_SCRIPT=$(mktemp 2>/dev/null)
        if [ -n "$PYTHON_FIX_SCRIPT" ]; then
cat > "$PYTHON_FIX_SCRIPT" <<'PY'
import os
import pathlib

path = pathlib.Path(os.environ["DOCKER_COMPOSE_PATH"])
text = path.read_text()

try:
    import yaml
except ImportError:
    lines = text.splitlines()
    result = []
    inserted = False
    for line in lines:
        result.append(line)
        if not inserted and line.lstrip().startswith("- ./agent_keys/"):
            indent = " " * (len(line) - len(line.lstrip()))
            if "./persistent_data/data:/data:Z" not in text:
                result.append(f"{indent}- ./persistent_data/data:/data:Z")
            if "./persistent_data/benchmarks:/benchmarks:Z" not in text:
                result.append(f"{indent}- ./persistent_data/benchmarks:/benchmarks:Z")
            inserted = True
    if inserted:
        path.write_text("\n".join(result) + "\n")
    raise SystemExit(0)

data = yaml.safe_load(text)
updated = False
for name, service in data.get("services", {}).items():
    if "_abci_" not in name:
        continue
    volumes = service.setdefault("volumes", [])
    for mount in ("./persistent_data/data:/data:Z", "./persistent_data/benchmarks:/benchmarks:Z"):
        if mount not in volumes:
            volumes.append(mount)
            updated = True

if updated:
    path.write_text(yaml.safe_dump(data, sort_keys=False, default_flow_style=False))
PY
            python3 "$PYTHON_FIX_SCRIPT" >/dev/null 2>&1 || poetry run python "$PYTHON_FIX_SCRIPT" >/dev/null 2>&1 || true
            rm -f "$PYTHON_FIX_SCRIPT"
        fi
        unset DOCKER_COMPOSE_PATH

        if [ -d "$DEPLOY_DIR" ]; then
            (cd "$DEPLOY_DIR" && docker-compose up -d --force-recreate >/dev/null 2>&1 && docker-compose ps)
        fi
    fi
fi

echo ""
echo "════════════════════════════════════════"
echo "  服务启动命令已执行"
echo "════════════════════════════════════════"
echo ""
echo "查看日志："
echo "  docker logs \$(docker ps -q --filter \"name=abci\") --follow"
echo ""
echo "停止服务："
echo "  ./stop_service.sh configs/config_supafund.json"
echo ""

if [ $RUN_SERVICE_EXIT -ne 0 ]; then
    echo "⚠️  run_service.sh 退出码：$RUN_SERVICE_EXIT（已尝试自动修复并重启容器）"
fi
