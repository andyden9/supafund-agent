#!/bin/bash

# ============================================================
# Trader Agent 启动脚本
# ============================================================

echo "========================================"
echo "启动 Trader Agent"
echo "========================================"

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "错误: Docker 未运行，请先启动 Docker Desktop"
    exit 1
fi

# 设置工作目录
cd "$(dirname "$0")"

echo ""
echo "注意事项："
echo "1. 你需要准备以下信息："
echo "   - Subgraph API Key (从 https://thegraph.com/studio/apikeys/ 获取)"
echo "   - Gnosis RPC endpoint (推荐使用 https://www.quicknode.com/)"
echo "   - 钱包私钥和地址"
echo "   - Safe 地址（可以通过脚本自动创建）"
echo ""
echo "2. 首次运行时，脚本会提示你输入这些信息"
echo "3. 信息会被保存，下次运行不需要重新输入"
echo ""
echo "4. 你需要在以下地址充值 xDAI："
echo "   - Agent 地址: 至少 0.1 xDAI"
echo "   - Safe 地址: 至少 5 xDAI"
echo ""

read -p "按 Enter 键继续，或 Ctrl+C 取消... "

# 运行 trader agent
echo ""
echo "启动 Trader Agent..."
./run_service.sh configs/config_predict_trader.json

echo ""
echo "服务已启动！"
echo ""
echo "查看日志命令："
echo "  docker logs trader_abci_0 --follow"
echo ""
echo "停止服务命令："
echo "  ./stop_service.sh configs/config_predict_trader.json"
