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

# 启动服务
./run_service.sh configs/config_supafund.json

# 修复部署目录权限（启动后）
if [ -f "./fix_deployment_dirs.sh" ]; then
    echo ""
    echo "正在修复部署目录权限..."
    ./fix_deployment_dirs.sh

    # 重启容器以应用新的卷挂载
    SERVICE_DIR=$(find .operate/services -name "deployment" -type d 2>/dev/null | head -1)
    if [ -n "$SERVICE_DIR" ]; then
        echo "重启容器以应用修复..."
        (cd "$SERVICE_DIR" && docker-compose restart 2>/dev/null) || true
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
