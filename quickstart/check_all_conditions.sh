#!/bin/bash

echo "====================================="
echo "Complete Button Status Debugger"
echo "====================================="
echo ""

SERVICE_ID="sc-7dc1d326-0f62-4816-bf02-e285d84be042"

echo "🔍 Checking ALL conditions that affect button state..."
echo ""

# 1. Service status
echo "1️⃣ Service Status:"
curl -s http://localhost:8000/api/v2/service/$SERVICE_ID | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'   Name: {data.get(\"name\")}')
print(f'   Hash: {data.get(\"hash\")}')
print(f'   Home Chain: {data.get(\"home_chain\")}')
deployment = data.get('deployment', {})
if deployment:
    print(f'   Deployment Status: {deployment.get(\"status\", \"NONE\")}')
else:
    print('   Deployment Status: NO DEPLOYMENT')
"
echo ""

# 2. Balance check
echo "2️⃣ Balance & Funding:"
curl -s http://localhost:8000/api/v2/service/$SERVICE_ID/refill_requirements | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'   allow_start_agent: {data.get(\"allow_start_agent\")}')
print(f'   is_refill_required: {data.get(\"is_refill_required\")}')

balances = data.get('balances', {}).get('gnosis', {})
master_safe = '0x118cd4C9A7D61c3D04CF426e184663036B9DF214'
if master_safe in balances:
    ms_bal = balances[master_safe]
    xdai = float(ms_bal.get('0x0000000000000000000000000000000000000000', 0)) / 1e18
    olas = float(ms_bal.get('0xcE11e14225575945b8E6Dc0D4F2dD4C570f79d9f', 0)) / 1e18
    print(f'   Master Safe: {xdai:.4f} xDAI, {olas:.4f} OLAS')
"
echo ""

# 3. Staking contract check
echo "3️⃣ Staking Contract:"
curl -s http://localhost:8000/api/v2/service/$SERVICE_ID | python3 -c "
import sys, json
data = json.load(sys.stdin)
staking_id = data.get('chain_configs', {}).get('gnosis', {}).get('chain_data', {}).get('user_params', {}).get('staking_program_id')
print(f'   Staking Program ID: {staking_id}')

env_vars = data.get('env_variables', {})
staking_addr = env_vars.get('STAKING_CONTRACT_ADDRESS', {}).get('value')
print(f'   Staking Contract: {staking_addr}')
"
echo ""

# 4. Check if contract is accessible
echo "4️⃣ Staking Contract Accessibility:"
STAKING_CONTRACT="0x2540Ea7b11a557957a913E7Ef314A9aF28472c08"
echo "   Checking if contract $STAKING_CONTRACT is accessible..."

curl -s -X POST https://gnosis-mainnet.g.alchemy.com/v2/k72mJduMTVP0-6rwv2f1m \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"$STAKING_CONTRACT\",\"latest\"],\"id\":1}" | python3 -c "
import sys, json
data = json.load(sys.stdin)
code = data.get('result', '0x')
if code == '0x' or code == '0x0':
    print('   ❌ Contract not found at address')
else:
    print(f'   ✅ Contract found (code length: {len(code)} chars)')
"
echo ""

# 5. Docker check
echo "5️⃣ Docker Status:"
if docker ps -a --filter "name=abci\|tm" --format "{{.Names}}" | grep -q .; then
    echo "   ⚠️  Docker containers exist:"
    docker ps -a --filter "name=abci\|tm" --format "   - {{.Names}}: {{.Status}}"
else
    echo "   ✅ No containers (expected before first start)"
fi
echo ""

echo "====================================="
echo "📊 DIAGNOSIS"
echo "====================================="
echo ""

# Final check
ALLOW_START=$(curl -s http://localhost:8000/api/v2/service/$SERVICE_ID/refill_requirements | python3 -c "import sys, json; print(json.load(sys.stdin).get('allow_start_agent', False))")

if [ "$ALLOW_START" = "True" ]; then
    echo "✅ Backend says: CAN START"
    echo ""
    echo "🔍 If button is still grayed out, possible causes:"
    echo ""
    echo "   1. Frontend is loading staking contract details (RPC issue)"
    echo "   2. Frontend cache is stale (need hard refresh)"
    echo "   3. Trader Agent might be marked as 'under construction'"
    echo "   4. React state not updated yet (wait 5-10 seconds)"
    echo ""
    echo "🔧 Try these fixes:"
    echo "   A. Hard refresh browser: Cmd+Shift+R (macOS)"
    echo "   B. Clear cache: localStorage.clear() in console"
    echo "   C. Wait 10 seconds for React Query to update"
    echo "   D. Check browser console for specific errors"
else
    echo "❌ Backend says: CANNOT START"
    echo "   Check balances and funding requirements above"
fi
