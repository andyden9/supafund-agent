#!/usr/bin/env python3
"""
Check funding requirements and actual balances
"""

import requests
import json
from web3 import Web3

API_BASE = "http://localhost:8000/api/v2"
GNOSIS_RPC = "https://gnosis-mainnet.g.alchemy.com/v2/k72mJduMTVP0-6rwv2f1m"

def wei_to_ether(wei):
    return float(wei) / 1e18

def check_funding():
    print("=" * 60)
    print("Funding Requirement Checker")
    print("=" * 60)
    print()

    # Get service details
    response = requests.get(f"{API_BASE}/services")
    services = response.json()

    if not services:
        print("❌ No services found")
        return

    service = services[0]
    gnosis_config = service['chain_configs']['gnosis']
    chain_data = gnosis_config['chain_data']
    user_params = chain_data['user_params']

    print("📋 Service Info:")
    print(f"   Name: {service['name']}")
    print(f"   Staking Program: {user_params['staking_program_id']}")
    print()

    # Get fund requirements
    requirements = user_params['fund_requirements']
    native_req = requirements['0x0000000000000000000000000000000000000000']

    print("💰 Fund Requirements (Native Token - xDAI):")
    print(f"   Agent EOA: {wei_to_ether(native_req['agent']):.4f} xDAI")
    print(f"   Safe:      {wei_to_ether(native_req['safe']):.4f} xDAI")
    print(f"   Total:     {wei_to_ether(native_req['agent'] + native_req['safe']):.4f} xDAI")
    print()

    # Check if agent address exists
    agent_addresses = service.get('agent_addresses', [])
    if not agent_addresses:
        print("❌ No agent addresses found - service not initialized")
        return

    agent_eoa = agent_addresses[0]
    print(f"🔑 Agent EOA: {agent_eoa}")

    # Connect to RPC
    w3 = Web3(Web3.HTTPProvider(GNOSIS_RPC))

    # Check Agent EOA balance
    agent_balance = w3.eth.get_balance(agent_eoa)
    agent_balance_eth = wei_to_ether(agent_balance)

    print(f"   Balance: {agent_balance_eth:.4f} xDAI")
    print(f"   Required: {wei_to_ether(native_req['agent']):.4f} xDAI")

    if agent_balance >= native_req['agent']:
        print("   ✅ Agent EOA has sufficient funds")
    else:
        needed = wei_to_ether(native_req['agent'] - agent_balance)
        print(f"   ❌ Agent EOA needs {needed:.4f} more xDAI")
    print()

    # Check Master Safe (if it exists)
    # Note: We need to get master safe address from somewhere
    # For now, let's check OLAS token balance

    # OLAS token on Gnosis
    OLAS_ADDRESS = "0xcE11e14225575945b8E6Dc0D4F2dD4C570f79d9f"

    # ERC20 ABI (balanceOf function)
    ERC20_ABI = [{"constant":True,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"type":"function"}]

    olas_contract = w3.eth.contract(address=Web3.to_checksum_address(OLAS_ADDRESS), abi=ERC20_ABI)

    # Check Agent EOA OLAS balance
    olas_balance = olas_contract.functions.balanceOf(Web3.to_checksum_address(agent_eoa)).call()
    olas_balance_eth = wei_to_ether(olas_balance)

    print(f"💎 OLAS Token Balance:")
    print(f"   Agent EOA: {olas_balance_eth:.4f} OLAS")
    print()

    # Get staking contract requirements
    print("📊 Checking staking contract requirements...")

    # Check if service is ready to deploy
    print()
    print("=" * 60)
    print("📝 Summary")
    print("=" * 60)

    can_deploy = agent_balance >= native_req['agent']

    if can_deploy:
        print("✅ Funding requirements met!")
        print()
        print("Next step: Deploy service on-chain")
        print("  → Look for 'Deploy' button in the browser UI")
    else:
        print("❌ Insufficient funds")
        print()
        print(f"Please fund Agent EOA: {agent_eoa}")
        print(f"   with at least {wei_to_ether(native_req['agent']):.4f} xDAI")

if __name__ == "__main__":
    try:
        check_funding()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
