#!/bin/bash

echo "====================================="
echo "Service Status Checker"
echo "====================================="
echo ""

SERVICE_ID="sc-7dc1d326-0f62-4816-bf02-e285d84be042"

echo "📋 Fetching service details..."
SERVICE_DATA=$(curl -s http://localhost:8000/api/v2/service/$SERVICE_ID)

echo ""
echo "🔍 Service Overview:"
echo "-------------------"
echo "$SERVICE_DATA" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f\"Service ID: {data.get('service_config_id', 'N/A')}\")
print(f\"Name: {data.get('name', 'N/A')}\")
print(f\"Home Chain: {data.get('home_chain', 'N/A')}\")
"

echo ""
echo "🔗 On-Chain Status:"
echo "-------------------"
echo "$SERVICE_DATA" | python3 -c "
import sys, json
data = json.load(sys.stdin)
chain_data = data.get('chain_configs', {}).get('gnosis', {}).get('chain_data', {})
token = chain_data.get('token', -1)
multisig = chain_data.get('multisig')
instances = chain_data.get('instances', [])

if token == -1:
    print('❌ Service NFT: NOT MINTED')
else:
    print(f'✅ Service NFT Token ID: {token}')

if multisig:
    print(f'✅ Agent Safe: {multisig}')
else:
    print('❌ Agent Safe: NOT CREATED')

if instances:
    print(f'✅ Agent Instances: {len(instances)}')
else:
    print('❌ Agent Instances: NONE')
"

echo ""
echo "🐳 Docker Status:"
echo "-----------------"
CONTAINERS=$(docker ps -a --filter "name=abci\|tm" --format "{{.Names}}")
if [ -z "$CONTAINERS" ]; then
    echo "❌ No containers found"
else
    docker ps -a --filter "name=abci\|tm" --format "table {{.Names}}\t{{.Status}}"
fi

echo ""
echo "🔌 Deployment Status:"
echo "---------------------"
echo "$SERVICE_DATA" | python3 -c "
import sys, json
data = json.load(sys.stdin)
deployment = data.get('deployment', {})
if not deployment:
    print('❌ No local deployment')
else:
    print(f'Status: {deployment.get(\"status\", \"unknown\")}')
    nodes = deployment.get('nodes', {})
    print(f'Agent nodes: {len(nodes.get(\"agent\", []))}')
    print(f'Tendermint nodes: {len(nodes.get(\"tendermint\", []))}')
"

echo ""
echo "🏥 Health Check:"
echo "----------------"
if curl -s -f http://127.0.0.1:8716/healthcheck > /dev/null 2>&1; then
    echo "✅ Agent healthcheck responding"
    curl -s http://127.0.0.1:8716/healthcheck | python3 -m json.tool | head -20
else
    echo "❌ Agent healthcheck not available (port 8716)"
fi

echo ""
echo "====================================="
echo "📝 Summary"
echo "====================================="
echo ""

if echo "$SERVICE_DATA" | python3 -c "import sys, json; data = json.load(sys.stdin); sys.exit(0 if data.get('chain_configs', {}).get('gnosis', {}).get('chain_data', {}).get('token', -1) == -1 else 1)"; then
    echo "🚨 ISSUE: Service is not deployed on-chain"
    echo ""
    echo "Next steps:"
    echo "1. In the browser, look for a 'Deploy' or 'Deploy On-Chain' button"
    echo "2. This will create the Safe and mint the service NFT"
    echo "3. After on-chain deployment, you can start the agent"
else
    echo "✅ Service is deployed on-chain"
    echo ""
    if [ -z "$CONTAINERS" ]; then
        echo "Next step: Start the agent from the browser UI"
    else
        echo "✅ Agent is running!"
    fi
fi
