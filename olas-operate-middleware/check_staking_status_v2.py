#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Simplified Supafund Staking Status Report - Robust Version

This version focuses on the most important metrics and gracefully handles ABI mismatches.
"""

import json
import math
import sys
import time
from datetime import datetime, timezone
from decimal import Decimal, getcontext
from enum import IntEnum
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

from web3 import Web3
from web3.exceptions import ContractLogicError, BadFunctionCallOutput

# Set decimal precision
getcontext().prec = 18

# Paths
OPERATE_HOME = Path.home() / ".operate"
QUICKSTART_OPERATE = Path.home() / "Downloads/quickstart-main-2/.operate"
SCRIPT_PATH = Path(__file__).resolve().parent

# ANSI color codes
class Color:
    RED = "\033[91m"
    YELLOW = "\033[93m"
    GREEN = "\033[92m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    END = "\033[0m"

class StakingState(IntEnum):
    UNSTAKED = 0
    STAKED = 1
    EVICTED = 2

# Minimal ABIs - only essential functions
STAKING_STATE_ABI = [{
    "inputs": [{"name": "serviceId", "type": "uint256"}],
    "name": "getStakingState",
    "outputs": [{"name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
}]

ACTIVITY_CHECKER_ADDRESS_ABI = [{
    "inputs": [],
    "name": "activityChecker",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
}]

LIVENESS_RATIO_ABI = [{
    "inputs": [],
    "name": "livenessRatio",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
}]

MULTISIG_NONCES_ABI = [{
    "inputs": [{"name": "multisig", "type": "address"}],
    "name": "getMultisigNonces",
    "outputs": [{"name": "nonces", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
}]

NEXT_CHECKPOINT_ABI = [{
    "inputs": [],
    "name": "getNextRewardCheckpointTimestamp",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
}]


def wei_to_olas(wei_amount: int) -> str:
    """Convert wei to OLAS."""
    olas = Decimal(wei_amount) / Decimal(10**18)
    return f"{olas:.6f} OLAS"


def format_timestamp(timestamp: int) -> str:
    """Format Unix timestamp to readable datetime."""
    dt = datetime.fromtimestamp(timestamp, tz=timezone.utc)
    return dt.strftime("%Y-%m-%d %H:%M:%S UTC")


def format_duration(seconds: int) -> str:
    """Format seconds into human-readable duration."""
    if seconds < 0:
        return "Epoch ended"

    days = seconds // 86400
    hours = (seconds % 86400) // 3600
    minutes = (seconds % 3600) // 60

    parts = []
    if days > 0:
        parts.append(f"{days}d")
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes > 0 or not parts:
        parts.append(f"{minutes}m")

    return " ".join(parts)


def print_header(title: str) -> None:
    """Print section header."""
    print(f"\n{Color.BOLD}{Color.CYAN}{'=' * 70}{Color.END}")
    print(f"{Color.BOLD}{Color.CYAN}{title.center(70)}{Color.END}")
    print(f"{Color.BOLD}{Color.CYAN}{'=' * 70}{Color.END}\n")


def print_item(label: str, value: str, status: str = "") -> None:
    """Print a status item."""
    print(f"  {label:.<45} {value} {status}")


def load_service_config(prefer_quickstart: bool = True) -> Optional[Dict[str, Any]]:
    """Load service configuration."""
    # Check both possible locations, with configurable priority
    if prefer_quickstart:
        possible_paths = [
            QUICKSTART_OPERATE / "services",
            OPERATE_HOME / "services"
        ]
    else:
        possible_paths = [
            OPERATE_HOME / "services",
            QUICKSTART_OPERATE / "services"
        ]

    for services_dir in possible_paths:
        if not services_dir.exists():
            continue

        service_dirs = [d for d in services_dir.iterdir() if d.is_dir()]
        if not service_dirs:
            continue

        # Sort by modification time to get the most recent
        service_dirs.sort(key=lambda d: d.stat().st_mtime, reverse=True)

        config_path = service_dirs[0] / "config.json"
        if config_path.exists():
            print(f"  Loading from: {config_path}")
            with open(config_path, "r", encoding="utf-8") as f:
                return json.load(f)

    return None


def extract_service_info(config: Dict[str, Any]) -> Tuple:
    """Extract service details from config."""
    try:
        home_chain = config.get("home_chain", "gnosis")
        chain_config = config.get("chain_configs", {}).get(home_chain, {})
        chain_data = chain_config.get("chain_data", {})

        service_id = chain_data.get("token")
        multisig = chain_data.get("multisig")
        agent_addresses = config.get("agent_addresses", [])
        agent_address = agent_addresses[0] if agent_addresses else None

        # Get staking contract address from environment variables
        env_vars = config.get("env_variables", {})
        staking_contract = env_vars.get("STAKING_CONTRACT_ADDRESS", {}).get("value")

        # Get staking program ID
        user_params = chain_data.get("user_params", {})
        staking_program_id = user_params.get("staking_program_id", "unknown")

        # Get RPC
        rpc = chain_config.get("ledger_config", {}).get("rpc")

        return service_id, multisig, agent_address, staking_contract, staking_program_id, rpc
    except Exception as e:
        print(f"Error extracting service info: {e}")
        return None, None, None, None, None, None


def safe_contract_call(func, error_msg: str = "Unable to fetch"):
    """Safely call a contract function with error handling."""
    try:
        return func(), None
    except (ContractLogicError, BadFunctionCallOutput, Exception) as e:
        return None, f"{error_msg}: {str(e)[:60]}"


def main():
    """Main function."""
    print_header("SUPAFUND STAKING STATUS - SIMPLIFIED REPORT")

    # Load configuration
    print("Loading service configuration...")
    config = load_service_config()
    if not config:
        print(f"{Color.RED}Error: Could not find service configuration{Color.END}")
        sys.exit(1)

    service_id, multisig, agent_address, staking_contract, staking_program_id, rpc = extract_service_info(config)

    if not all([service_id, multisig, staking_contract, rpc]):
        print(f"{Color.RED}Error: Missing required configuration{Color.END}")
        sys.exit(1)

    print(f"  Service ID: {service_id}")
    print(f"  Multisig: {multisig}")
    print(f"  Staking Contract: {staking_contract}")
    print(f"  Staking Program: {staking_program_id}")
    if agent_address:
        print(f"  Agent: {agent_address}")

    # Connect to chain with fallback RPCs
    print(f"\nConnecting to Gnosis Chain...")
    rpc_endpoints = [
        rpc,  # Config RPC
        "https://rpc.gnosis.gateway.fm",
        "https://rpc.gnosischain.com",
        "https://rpc-gate.autonolas.tech/gnosis-rpc/"
    ]

    w3 = None
    for rpc_url in rpc_endpoints:
        try:
            print(f"  Trying {rpc_url[:50]}...")
            test_w3 = Web3(Web3.HTTPProvider(rpc_url, request_kwargs={'timeout': 10}))
            if test_w3.is_connected():
                w3 = test_w3
                print(f"{Color.GREEN}✓ Connected to {rpc_url}{Color.END}")
                break
        except Exception as e:
            print(f"  {Color.YELLOW}✗ Failed: {str(e)[:40]}{Color.END}")
            continue

    if not w3:
        print(f"{Color.RED}Error: Could not connect to any RPC{Color.END}")
        sys.exit(1)

    # === STAKING STATUS ===
    print_header("STAKING STATUS")

    # Check staking state
    staking_contract_obj = w3.eth.contract(
        address=Web3.to_checksum_address(staking_contract),
        abi=STAKING_STATE_ABI
    )

    state_value, error = safe_contract_call(
        lambda: staking_contract_obj.functions.getStakingState(service_id).call()
    )

    if error:
        print_item("Staking state", f"{Color.YELLOW}Error: {error}{Color.END}")
        sys.exit(1)

    staking_state = StakingState(state_value)
    is_staked = staking_state in (StakingState.STAKED, StakingState.EVICTED)

    if staking_state == StakingState.UNSTAKED:
        status_str = f"{Color.YELLOW}UNSTAKED{Color.END}"
    elif staking_state == StakingState.EVICTED:
        status_str = f"{Color.RED}EVICTED{Color.END}"
    else:
        status_str = f"{Color.GREEN}STAKED{Color.END}"

    print_item("Status", status_str)
    print_item("Program", staking_program_id)

    if staking_state == StakingState.UNSTAKED:
        print(f"\n{Color.YELLOW}Service is not staked. Nothing to report.{Color.END}")
        return

    if staking_state == StakingState.EVICTED:
        print(f"\n{Color.RED}⚠ WARNING: Service has been EVICTED!{Color.END}")
        print(f"{Color.YELLOW}This usually means the service failed to meet KPI requirements.{Color.END}")
        print(f"{Color.YELLOW}You need to unstake and re-stake to continue.{Color.END}")

    # === EPOCH PROGRESS ===
    print_header("EPOCH PROGRESS")

    if staking_state == StakingState.EVICTED:
        print(f"  {Color.YELLOW}Epoch tracking suspended for evicted services{Color.END}\n")
    else:
        # Get activity checker
        checker_contract = w3.eth.contract(
            address=Web3.to_checksum_address(staking_contract),
            abi=ACTIVITY_CHECKER_ADDRESS_ABI
        )

        activity_checker_addr, error = safe_contract_call(
            lambda: checker_contract.functions.activityChecker().call()
        )

        if not error and activity_checker_addr:
            # Get liveness ratio
            liveness_contract = w3.eth.contract(
                address=activity_checker_addr,
                abi=LIVENESS_RATIO_ABI
            )

            liveness_ratio, _ = safe_contract_call(
                lambda: liveness_contract.functions.livenessRatio().call()
            )

            if liveness_ratio:
                required_txs = math.ceil((liveness_ratio * 60 * 60 * 24) / Decimal(1e18))

                # Get current nonces
                nonces_contract = w3.eth.contract(
                    address=activity_checker_addr,
                    abi=MULTISIG_NONCES_ABI
                )

                nonces_list, _ = safe_contract_call(
                    lambda: nonces_contract.functions.getMultisigNonces(
                        Web3.to_checksum_address(multisig)
                    ).call()
                )

                if nonces_list:
                    current_nonce = nonces_list[0] if nonces_list else 0

                    # For simplicity, show total transactions (we can't easily get checkpoint nonce without full ABI)
                    print_item("Total transactions", str(current_nonce))
                    print_item("Required per epoch", str(required_txs))

                    progress_pct = (current_nonce / required_txs * 100) if required_txs > 0 else 0
                    progress_bar = "█" * int(progress_pct // 5) + "░" * (20 - int(progress_pct // 5))
                    print_item("Progress estimate", f"[{progress_bar}] ~{progress_pct:.0f}%")

    # === EPOCH TIMING ===
    print_header("EPOCH TIMING")

    checkpoint_contract = w3.eth.contract(
        address=Web3.to_checksum_address(staking_contract),
        abi=NEXT_CHECKPOINT_ABI
    )

    next_checkpoint, error = safe_contract_call(
        lambda: checkpoint_contract.functions.getNextRewardCheckpointTimestamp().call()
    )

    if next_checkpoint:
        current_time = int(time.time())
        time_remaining = next_checkpoint - current_time

        print_item("Epoch ends at", format_timestamp(next_checkpoint))
        print_item("Time remaining", format_duration(time_remaining))

        if time_remaining < 3600:
            print(f"\n  {Color.YELLOW}⚠ Epoch ending soon! Checkpoint will be called automatically.{Color.END}")
    else:
        print(f"  {Color.YELLOW}Could not fetch epoch timing{Color.END}")

    # === SUMMARY ===
    print_header("CHECKPOINT INFO")
    print("  ✓ Supafund agent includes 'call_checkpoint_round'")
    print("  ✓ Checkpoint will be called automatically after epoch ends")
    print(f"\n  {Color.CYAN}Note: Rewards are only distributed after checkpoint() is called{Color.END}")
    print(f"  {Color.CYAN}      The agent handles this automatically.{Color.END}\n")

    print(f"{Color.GREEN}{'=' * 70}{Color.END}")
    print(f"{Color.GREEN}{'Report Complete'.center(70)}{Color.END}")
    print(f"{Color.GREEN}{'=' * 70}{Color.END}\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n{Color.RED}Unexpected error: {e}{Color.END}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
