#!/bin/bash

# 更换 Gnosis RPC 脚本

NEW_RPC="$1"

if [ -z "$NEW_RPC" ]; then
    echo "用法: ./change_rpc.sh <new_rpc_url>"
    echo ""
    echo "示例:"
    echo "  ./change_rpc.sh https://rpc.gnosischain.com"
    echo "  ./change_rpc.sh https://gnosis.drpc.org"
    echo "  ./change_rpc.sh https://your-custom-rpc.com"
    echo ""
    echo "推荐的公共 RPC:"
    echo "  - https://rpc.gnosischain.com (官方)"
    echo "  - https://gnosis.drpc.org (dRPC)"
    echo "  - https://gnosis-rpc.publicnode.com"
    echo "  - https://rpc.ankr.com/gnosis"
    echo ""
    exit 1
fi

echo "══════════════════════════════════════"
echo "  更换 Gnosis RPC"
echo "══════════════════════════════════════"
echo ""
echo "新 RPC: $NEW_RPC"
echo ""

# 查找服务配置文件
SERVICE_CONFIG=$(ls -d .operate/services/sc-*/config.json 2>/dev/null | head -1)

if [ -z "$SERVICE_CONFIG" ]; then
    echo "❌ 未找到服务配置文件"
    echo "   请确保在 quickstart 目录中运行此脚本"
    exit 1
fi

echo "找到配置文件: $SERVICE_CONFIG"
echo ""

# 备份
BACKUP_FILE="${SERVICE_CONFIG}.rpc_backup_$(date +%s)"
cp "$SERVICE_CONFIG" "$BACKUP_FILE"
echo "✓ 已备份到: $BACKUP_FILE"
echo ""

# 使用 Python 更新 JSON（更安全）
python3 << EOF
import json

with open('$SERVICE_CONFIG', 'r') as f:
    config = json.load(f)

# 更新位置 1: chain_configs.gnosis.ledger_config.rpc
if 'chain_configs' in config and 'gnosis' in config['chain_configs']:
    config['chain_configs']['gnosis']['ledger_config']['rpc'] = '$NEW_RPC'
    print("✓ 更新: chain_configs.gnosis.ledger_config.rpc")

# 更新位置 2: env_variables.GNOSIS_LEDGER_RPC.value
if 'env_variables' in config and 'GNOSIS_LEDGER_RPC' in config['env_variables']:
    config['env_variables']['GNOSIS_LEDGER_RPC']['value'] = '$NEW_RPC'
    print("✓ 更新: env_variables.GNOSIS_LEDGER_RPC.value")

with open('$SERVICE_CONFIG', 'w') as f:
    json.dump(config, f, indent=2)

print("")
print("✅ RPC 更新完成！")
EOF

echo ""
echo "══════════════════════════════════════"
echo "  下一步"
echo "══════════════════════════════════════"
echo ""
echo "1. 验证新 RPC:"
echo "   curl -s -X POST $NEW_RPC \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}'"
echo ""
echo "2. 重启服务:"
echo "   docker stop \$(docker ps -q --filter \"name=trader\")"
echo "   docker rm \$(docker ps -aq --filter \"name=trader\")"
echo "   ./run_service.sh configs/config_supafund_v2.json"
echo ""
echo "如需回滚:"
echo "   cp $BACKUP_FILE $SERVICE_CONFIG"
echo ""
