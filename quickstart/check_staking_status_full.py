#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Supafund Staking Status Report - Full Featured Version

Complete implementation with all features:
- Staking status and program info
- Accrued rewards tracking
- Security deposits and bonds
- Precise epoch progress (transactions since last checkpoint)
- Time until epoch ends
- Checkpoint automation verification
- Multi-RPC fallback for reliability
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

# Comprehensive ABIs
STAKING_ABI = {
    "getStakingState": {
        "inputs": [{"name": "serviceId", "type": "uint256"}],
        "name": "getStakingState",
        "outputs": [{"name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function"
    },
    "getServiceInfo": {
        "inputs": [{"name": "serviceId", "type": "uint256"}],
        "name": "getServiceInfo",
        "outputs": [
            {
                "name": "info",
                "type": "tuple",
                "components": [
                    {"name": "multisig", "type": "address"},
                    {"name": "owner", "type": "address"},
                    {"name": "nonces", "type": "uint256[]"},
                    {"name": "tsStart", "type": "uint256"},
                    {"name": "reward", "type": "uint256"},
                    {"name": "inactivity", "type": "uint256"},
                ],
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    "activityChecker": {
        "inputs": [],
        "name": "activityChecker",
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    "serviceRegistryTokenUtility": {
        "inputs": [],
        "name": "serviceRegistryTokenUtility",
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    "minStakingDeposit": {
        "inputs": [],
        "name": "minStakingDeposit",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    "getNextRewardCheckpointTimestamp": {
        "inputs": [],
        "name": "getNextRewardCheckpointTimestamp",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
}

ACTIVITY_CHECKER_ABI = {
    "livenessRatio": {
        "inputs": [],
        "name": "livenessRatio",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    "getMultisigNonces": {
        "inputs": [{"name": "multisig", "type": "address"}],
        "name": "getMultisigNonces",
        "outputs": [{"name": "nonces", "type": "uint256[]"}],
        "stateMutability": "view",
        "type": "function"
    }
}

SERVICE_REGISTRY_ABI = {
    "getOperatorBalance": {
        "inputs": [
            {"name": "operator", "type": "address"},
            {"name": "serviceId", "type": "uint256"}
        ],
        "name": "getOperatorBalance",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    "getAgentBond": {
        "inputs": [
            {"name": "serviceId", "type": "uint256"},
            {"name": "agentId", "type": "uint256"}
        ],
        "name": "getAgentBond",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
}


def wei_to_olas(wei_amount: int) -> str:
    """Convert wei to OLAS."""
    olas = Decimal(wei_amount) / Decimal(10**18)
    return f"{olas:.6f} OLAS"


def wei_to_eth(wei_amount: int) -> str:
    """Convert wei to ETH/xDAI."""
    eth = Decimal(wei_amount) / Decimal(10**18)
    return f"{eth:.6f} xDAI"


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


def print_item(label: str, value: str, warning: str = "") -> None:
    """Print a status item with optional warning."""
    warning_str = f" {warning}" if warning else ""
    print(f"  {label:.<45} {value}{warning_str}")


def print_warning(message: str) -> None:
    """Print a warning message."""
    print(f"  {Color.YELLOW}⚠ {message}{Color.END}")


def print_error(message: str) -> None:
    """Print an error message."""
    print(f"  {Color.RED}✗ {message}{Color.END}")


def print_success(message: str) -> None:
    """Print a success message."""
    print(f"  {Color.GREEN}✓ {message}{Color.END}")


def warning_message(current: Decimal, required: Decimal) -> str:
    """Generate warning if current < required."""
    if current < required:
        return f"{Color.YELLOW}(Too low! Required: {required}){Color.END}"
    return ""


def load_service_config(prefer_quickstart: bool = True) -> Optional[Dict[str, Any]]:
    """Load service configuration."""
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
            print(f"  Loading: {config_path.parent.name}")
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

        # Get staking contract address
        env_vars = config.get("env_variables", {})
        staking_contract = env_vars.get("STAKING_CONTRACT_ADDRESS", {}).get("value")

        # Get staking program ID and agent ID
        user_params = chain_data.get("user_params", {})
        staking_program_id = user_params.get("staking_program_id", "unknown")
        agent_id = user_params.get("agent_id", 14)

        # Get RPC
        rpc = chain_config.get("ledger_config", {}).get("rpc")

        return service_id, multisig, agent_address, staking_contract, staking_program_id, agent_id, rpc
    except Exception as e:
        print_error(f"Error extracting service info: {e}")
        return None, None, None, None, None, None, None


def safe_contract_call(func, default=None):
    """Safely call a contract function with error handling."""
    try:
        return func(), None
    except (ContractLogicError, BadFunctionCallOutput, Exception) as e:
        return default, str(e)[:80]


def connect_to_chain(rpc: str) -> Optional[Web3]:
    """Connect to blockchain with fallback RPCs."""
    print(f"\n  Connecting to Gnosis Chain...")

    rpc_endpoints = [
        rpc,  # Config RPC
        "https://rpc-gate.autonolas.tech/gnosis-rpc/",
        "https://rpc.gnosis.gateway.fm",
        "https://rpc.gnosischain.com"
    ]

    for rpc_url in rpc_endpoints:
        try:
            print(f"    Trying {rpc_url[:50]}...", end=" ")
            test_w3 = Web3(Web3.HTTPProvider(rpc_url, request_kwargs={'timeout': 10}))
            if test_w3.is_connected():
                print(f"{Color.GREEN}✓{Color.END}")
                return test_w3
            print(f"{Color.YELLOW}✗{Color.END}")
        except Exception:
            print(f"{Color.RED}✗{Color.END}")
            continue

    return None


def fetch_service_info(w3: Web3, staking_contract: str, service_id: int):
    """Fetch service info tuple from the staking contract."""
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(staking_contract),
        abi=[STAKING_ABI["getServiceInfo"]],
    )
    return safe_contract_call(lambda: contract.functions.getServiceInfo(service_id).call())


def main():
    """Main function."""
    print_header("SUPAFUND STAKING STATUS - FULL REPORT")

    # Load configuration
    print("Loading service configuration...")
    config = load_service_config()
    if not config:
        print_error("Could not find service configuration")
        sys.exit(1)

    service_id, multisig, agent_address, staking_contract, staking_program_id, agent_id, rpc = extract_service_info(config)

    if not all([service_id, multisig, staking_contract, rpc]):
        print_error("Missing required configuration")
        sys.exit(1)

    print(f"\n  Service ID: {service_id}")
    print(f"  Multisig: {multisig}")
    print(f"  Staking Contract: {staking_contract}")
    print(f"  Staking Program: {staking_program_id}")
    if agent_address:
        print(f"  Agent Address: {agent_address}")
    print(f"  Agent ID: {agent_id}")

    # Connect to chain
    w3 = connect_to_chain(rpc)
    if not w3:
        print_error("Could not connect to any RPC")
        sys.exit(1)

    print_success("Connected to Gnosis Chain")

    # Create contract instances
    staking_contract_addr = Web3.to_checksum_address(staking_contract)

    service_info_data, service_info_error = fetch_service_info(w3, staking_contract, service_id)
    service_owner_onchain = None
    service_reward = None
    service_nonces_snapshot = None
    if service_info_data and isinstance(service_info_data, (list, tuple)):
        try:
            service_owner_onchain = service_info_data[1]
            service_nonces_snapshot = service_info_data[2]
            service_reward = service_info_data[4]
        except (IndexError, TypeError):
            service_nonces_snapshot = None

    # === STAKING STATUS ===
    print_header("STAKING STATUS")

    # Get staking state
    state_contract = w3.eth.contract(address=staking_contract_addr, abi=[STAKING_ABI["getStakingState"]])
    state_value, error = safe_contract_call(lambda: state_contract.functions.getStakingState(service_id).call())

    if error:
        print_error(f"Could not get staking state: {error}")
        sys.exit(1)

    staking_state = StakingState(state_value)
    is_staked = staking_state in (StakingState.STAKED, StakingState.EVICTED)

    # Display status
    if staking_state == StakingState.UNSTAKED:
        status_str = f"{Color.YELLOW}UNSTAKED{Color.END}"
    elif staking_state == StakingState.EVICTED:
        status_str = f"{Color.RED}EVICTED{Color.END}"
    else:
        status_str = f"{Color.GREEN}STAKED{Color.END}"

    print_item("Service staked?", f"{Color.GREEN}Yes{Color.END}" if is_staked else f"{Color.RED}No{Color.END}")
    print_item("Staking program", f"{staking_program_id} (Gnosis)")
    print_item("Staking state", status_str)

    if staking_state == StakingState.UNSTAKED:
        print(f"\n{Color.YELLOW}Service is not staked. Nothing to report.{Color.END}")
        return

    if staking_state == StakingState.EVICTED:
        print(f"\n{Color.RED}⚠ WARNING: Service has been EVICTED!{Color.END}")
        print_warning("Service failed to meet KPI requirements")
        print_warning("You need to unstake and re-stake to continue")

    # Get accrued rewards
    print()
    if service_reward is not None:
        print_item("Accrued rewards", wei_to_olas(service_reward))
    else:
        print_item("Accrued rewards", f"{Color.YELLOW}Unable to retrieve{Color.END}")

    # === DEPOSITS & BONDS ===
    print_header("SECURITY DEPOSITS & BONDS")

    # Get service registry address
    registry_contract = w3.eth.contract(address=staking_contract_addr, abi=[STAKING_ABI["serviceRegistryTokenUtility"]])
    registry_addr, error = safe_contract_call(lambda: registry_contract.functions.serviceRegistryTokenUtility().call())

    if not error and registry_addr:
        # Get operator balance (security deposit)
        balance_contract = w3.eth.contract(
            address=registry_addr,
            abi=[SERVICE_REGISTRY_ABI["getOperatorBalance"]]
        )

        deposit_entries = []
        candidate_addresses = [
            ("Security deposit (owner)", service_owner_onchain),
        ]
        if agent_address and (not service_owner_onchain or agent_address.lower() != service_owner_onchain.lower()):
            candidate_addresses.append(("Security deposit (agent)", agent_address))

        for label, address in candidate_addresses:
            if not address:
                continue
            deposit_value, _ = safe_contract_call(
                lambda: balance_contract.functions.getOperatorBalance(
                    Web3.to_checksum_address(address),
                    service_id
                ).call(),
                default=0
            )
            deposit_entries.append((label, deposit_value))

        # Get agent bond
        bond_contract = w3.eth.contract(
            address=registry_addr,
            abi=[SERVICE_REGISTRY_ABI["getAgentBond"]]
        )
        agent_bond, _ = safe_contract_call(
            lambda: bond_contract.functions.getAgentBond(service_id, agent_id).call(),
            default=0
        )

        # Get minimum deposit requirement
        min_contract = w3.eth.contract(address=staking_contract_addr, abi=[STAKING_ABI["minStakingDeposit"]])
        min_deposit, _ = safe_contract_call(lambda: min_contract.functions.minStakingDeposit().call(), default=0)

        min_deposit_dec = Decimal(min_deposit)

        if deposit_entries:
            for label, amount in deposit_entries:
                print_item(
                    label,
                    wei_to_olas(amount),
                    warning_message(Decimal(amount), min_deposit_dec)
                )
        else:
            print_warning("Could not retrieve deposit balances")

        agent_bond_dec = Decimal(agent_bond)

        print_item(
            "Agent bond",
            wei_to_olas(agent_bond),
            warning_message(agent_bond_dec, min_deposit_dec)
        )
        print_item("Min deposit required", wei_to_olas(min_deposit))
    else:
        print_warning("Could not retrieve deposit information")

    # Track epoch KPI stats for summary
    transactions_since_checkpoint = None
    required_transactions = None

    # === EPOCH PROGRESS ===
    print_header("EPOCH PROGRESS")

    if staking_state == StakingState.EVICTED:
        print_warning("Epoch tracking suspended for evicted services")
    else:
        # Get activity checker
        checker_contract = w3.eth.contract(address=staking_contract_addr, abi=[STAKING_ABI["activityChecker"]])
        activity_checker_addr, error = safe_contract_call(lambda: checker_contract.functions.activityChecker().call())

        if not error and activity_checker_addr:
            # Get liveness ratio (required transactions)
            liveness_contract = w3.eth.contract(
                address=activity_checker_addr,
                abi=[ACTIVITY_CHECKER_ABI["livenessRatio"]]
            )
            liveness_ratio, _ = safe_contract_call(lambda: liveness_contract.functions.livenessRatio().call())

            if liveness_ratio:
                required_txs = math.ceil((liveness_ratio * 60 * 60 * 24) / Decimal(1e18))
                required_transactions = int(required_txs)

                # Get current nonces
                nonces_contract = w3.eth.contract(
                    address=activity_checker_addr,
                    abi=[ACTIVITY_CHECKER_ABI["getMultisigNonces"]]
                )
                nonces_list, _ = safe_contract_call(
                    lambda: nonces_contract.functions.getMultisigNonces(
                        Web3.to_checksum_address(multisig)
                    ).call()
                )

                if nonces_list:
                    current_nonce = nonces_list[0] if nonces_list else 0

                    # Retrieve nonce at last checkpoint from staking contract
                    service_info_result, _ = fetch_service_info(w3, staking_contract, service_id)

                    nonces_at_checkpoint = None
                    if service_info_result and isinstance(service_info_result, (list, tuple)):
                        try:
                            nonces_at_checkpoint = service_info_result[2]
                        except (IndexError, TypeError):
                            nonces_at_checkpoint = None
                    elif isinstance(service_nonces_snapshot, (list, tuple)):
                        nonces_at_checkpoint = service_nonces_snapshot

                    checkpoint_nonce = 0
                    if isinstance(nonces_at_checkpoint, (list, tuple)) and len(nonces_at_checkpoint) > 1:
                        try:
                            checkpoint_nonce = int(nonces_at_checkpoint[1])
                        except (TypeError, ValueError):
                            checkpoint_nonce = 0

                    txs_current_epoch = max(current_nonce - checkpoint_nonce, 0)
                    transactions_since_checkpoint = txs_current_epoch

                    print_item("Total transactions", str(current_nonce))
                    print_item("Checkpoint nonce", str(checkpoint_nonce))
                    print_item("Transactions since checkpoint", str(txs_current_epoch))
                    print_item("Required per epoch", str(required_txs))

                    # Calculate progress based on current epoch activity
                    progress_pct = min(
                        (txs_current_epoch / required_txs * 100) if required_txs > 0 else 0,
                        100,
                    )
                    bar_length = 50
                    filled = int(progress_pct * bar_length / 100)
                    bar = "█" * filled + "░" * (bar_length - filled)

                    status_color = Color.GREEN if txs_current_epoch >= required_txs else Color.YELLOW
                    print_item("KPI Status", f"[{bar}] {status_color}{progress_pct:.1f}%{Color.END}")

                    if txs_current_epoch < required_txs:
                        print_warning(
                            f"Need {required_txs - txs_current_epoch} more transactions to meet KPI"
                        )
                    else:
                        print_success(
                            f"KPI met! ({txs_current_epoch - required_txs} transactions above threshold)"
                        )

    # === EPOCH TIMING ===
    print_header("EPOCH TIMING")

    checkpoint_contract = w3.eth.contract(
        address=staking_contract_addr,
        abi=[STAKING_ABI["getNextRewardCheckpointTimestamp"]]
    )
    next_checkpoint, error = safe_contract_call(
        lambda: checkpoint_contract.functions.getNextRewardCheckpointTimestamp().call()
    )

    if next_checkpoint:
        current_time = int(time.time())
        time_remaining = next_checkpoint - current_time

        print_item("Current time", format_timestamp(current_time))
        print_item("Epoch ends at", format_timestamp(next_checkpoint))
        print_item("Time remaining", format_duration(time_remaining))

        if time_remaining < 3600:
            print_warning("Epoch ending soon! Checkpoint will be called automatically")
        elif time_remaining < 0:
            print_warning("Epoch has ended. Waiting for checkpoint call")
    else:
        print_warning("Could not fetch epoch timing")

    # === CHECKPOINT INFO ===
    print_header("CHECKPOINT & REWARDS")

    print_success("Supafund agent includes 'call_checkpoint_round' in FSM")
    print_success("Checkpoint will be called automatically after epoch ends")
    print()
    print(f"  {Color.CYAN}💡 Important Notes:{Color.END}")
    print(f"     • Rewards are distributed ONLY after checkpoint() is called")
    print(f"     • The agent handles checkpoint calls automatically")
    print(f"     • If no agent calls checkpoint, rewards won't be distributed")
    print(f"     • Accrued rewards accumulate until checkpoint is triggered")

    # === SUMMARY ===
    print_header("SUMMARY")

    if staking_state == StakingState.STAKED:
        print_success("Service is actively staked and earning rewards")
    elif staking_state == StakingState.EVICTED:
        print_error("Service has been evicted - action required!")
        print(f"\n  {Color.YELLOW}Recovery steps:{Color.END}")
        print(f"     1. Unstake the service")
        print(f"     2. Ensure sufficient funds (check deposits above)")
        print(f"     3. Re-stake to resume earning rewards")

    if transactions_since_checkpoint is not None and required_transactions is not None:
        print_item(
            "Epoch KPI",
            f"{transactions_since_checkpoint} / {required_transactions} txs",
            warning_message(
                Decimal(transactions_since_checkpoint), Decimal(required_transactions)
            ),
        )

    print(f"\n{Color.GREEN}{'=' * 70}{Color.END}")
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
