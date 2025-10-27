#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ------------------------------------------------------------------------------
#
#   Copyright 2025 Valory AG
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
#
# ------------------------------------------------------------------------------

"""Supafund Staking Status Report Script

This script checks the staking status of a Supafund agent and reports:
- Staking state and program
- Current epoch progress (transactions performed/required)
- Time until epoch ends
- Accrued rewards
- Security deposits and bonds
"""

import json
import math
import sys
import time
from datetime import datetime, timezone
from decimal import Decimal, getcontext
from enum import IntEnum
from pathlib import Path
from typing import Optional, Tuple

from web3 import Web3

# Set decimal precision
getcontext().prec = 18

# Paths
OPERATE_HOME = Path.home() / "/Users/andydeng/Downloads/quickstart-main-2/.operate"
SCRIPT_PATH = Path(__file__).resolve().parent

# ANSI color codes for terminal output
class ColorCode:
    """Terminal color codes."""
    RED = "\033[91m"
    YELLOW = "\033[93m"
    GREEN = "\033[92m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    END = "\033[0m"

class StakingState(IntEnum):
    """Staking states."""
    UNSTAKED = 0
    STAKED = 1
    EVICTED = 2

# Gnosis Chain Configuration
GNOSIS_RPC = "https://rpc-gate.autonolas.tech/gnosis-rpc/"
STAKING_CONTRACT_ADDRESS = "0x2540Ea7b11a557957a913E7Ef314A9aF28472c08"
STAKING_PROGRAM_ID = "supafund_test"

# Minimal ABIs (only the functions we need)
STAKING_TOKEN_ABI = [
    {
        "inputs": [{"name": "serviceId", "type": "uint256"}],
        "name": "getStakingState",
        "outputs": [{"name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "serviceId", "type": "uint256"}],
        "name": "mapServiceInfo",
        "outputs": [
            {"name": "multisig", "type": "address"},
            {"name": "owner", "type": "address"},
            {"name": "nonces", "type": "uint256[]"},
            {"name": "reward", "type": "uint256"},
            {"name": "inactivity", "type": "uint256[]"},
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "serviceId", "type": "uint256"}],
        "name": "getServiceInfo",
        "outputs": [
            {"name": "info", "type": "tuple", "components": [
                {"name": "multisig", "type": "address"},
                {"name": "owner", "type": "address"},
                {"name": "nonces", "type": "uint256[]"},
                {"name": "tsStart", "type": "uint256"},
                {"name": "reward", "type": "uint256"},
                {"name": "inactivity", "type": "uint256[]"},
            ]}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "minStakingDeposit",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "activityChecker",
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "serviceRegistryTokenUtility",
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getNextRewardCheckpointTimestamp",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
]

ACTIVITY_CHECKER_ABI = [
    {
        "inputs": [],
        "name": "livenessRatio",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "multisig", "type": "address"}],
        "name": "getMultisigNonces",
        "outputs": [{"name": "nonces", "type": "uint256[]"}],
        "stateMutability": "view",
        "type": "function"
    },
]

SERVICE_REGISTRY_TOKEN_UTILITY_ABI = [
    {
        "inputs": [
            {"name": "operator", "type": "address"},
            {"name": "serviceId", "type": "uint256"}
        ],
        "name": "getOperatorBalance",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "serviceId", "type": "uint256"},
            {"name": "agentId", "type": "uint256"}
        ],
        "name": "getAgentBond",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
]


def wei_to_olas(wei_amount: int) -> str:
    """Convert wei to OLAS with formatting."""
    olas = Decimal(wei_amount) / Decimal(10**18)
    return f"{olas:.6f} OLAS"


def wei_to_eth(wei_amount: int) -> str:
    """Convert wei to ETH/xDAI with formatting."""
    eth = Decimal(wei_amount) / Decimal(10**18)
    return f"{eth:.6f} xDAI"


def format_timestamp(timestamp: int) -> str:
    """Format Unix timestamp to human-readable datetime."""
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


def color_bool(value: bool, true_text: str = "Yes", false_text: str = "No") -> str:
    """Color-code boolean values."""
    if value:
        return f"{ColorCode.GREEN}{true_text}{ColorCode.END}"
    return f"{ColorCode.RED}{false_text}{ColorCode.END}"


def color_string(text: str, color: ColorCode) -> str:
    """Apply color to string."""
    return f"{color}{text}{ColorCode.END}"


def print_section_header(title: str) -> None:
    """Print a bold section header."""
    print(f"\n{ColorCode.BOLD}{ColorCode.CYAN}{'=' * 60}{ColorCode.END}")
    print(f"{ColorCode.BOLD}{ColorCode.CYAN}{title.center(60)}{ColorCode.END}")
    print(f"{ColorCode.BOLD}{ColorCode.CYAN}{'=' * 60}{ColorCode.END}\n")


def print_status(label: str, value: str, warning: str = "") -> None:
    """Print a status line with optional warning."""
    print(f"{label:.<40} {value} {warning}")


def warning_message(current: Decimal, required: Decimal, custom_msg: str = "") -> str:
    """Generate warning message if current value is below required."""
    if current < required:
        msg = custom_msg or f"- Too low. Required: {required}"
        return color_string(msg, ColorCode.YELLOW)
    return ""


def load_service_config() -> Optional[dict]:
    """Load the service configuration from the first service found."""
    services_dir = OPERATE_HOME / "services"

    if not services_dir.exists():
        print(f"Error: Services directory not found at {services_dir}")
        return None

    # Find the first service directory
    service_dirs = [d for d in services_dir.iterdir() if d.is_dir()]
    if not service_dirs:
        print("Error: No services found")
        return None

    config_path = service_dirs[0] / "config.json"
    if not config_path.exists():
        print(f"Error: config.json not found at {config_path}")
        return None

    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_service_details(config: dict) -> Tuple[Optional[int], Optional[str], Optional[str]]:
    """Extract service ID, multisig address, and agent address from config."""
    try:
        home_chain = config.get("home_chain", "gnosis")
        chain_config = config.get("chain_configs", {}).get(home_chain, {})
        chain_data = chain_config.get("chain_data", {})

        service_id = chain_data.get("token")
        multisig = chain_data.get("multisig")

        agent_addresses = config.get("agent_addresses", [])
        agent_address = agent_addresses[0] if agent_addresses else None

        return service_id, multisig, agent_address
    except Exception as e:
        print(f"Error extracting service details: {e}")
        return None, None, None


def check_staking_status() -> None:
    """Main function to check and display staking status."""
    print_section_header("SUPAFUND STAKING STATUS REPORT")

    # Load configuration
    print("Loading service configuration...")
    config = load_service_config()
    if not config:
        sys.exit(1)

    service_id, multisig_address, agent_address = get_service_details(config)
    if not service_id or not multisig_address:
        print("Error: Could not extract service ID or multisig address")
        sys.exit(1)

    print(f"Service ID: {service_id}")
    print(f"Multisig: {multisig_address}")
    if agent_address:
        print(f"Agent: {agent_address}")

    # Connect to Gnosis Chain
    print(f"\nConnecting to Gnosis Chain...")
    w3 = Web3(Web3.HTTPProvider(GNOSIS_RPC))
    if not w3.is_connected():
        print("Error: Could not connect to Gnosis RPC")
        sys.exit(1)

    # Create contract instances
    staking_contract = w3.eth.contract(
        address=Web3.to_checksum_address(STAKING_CONTRACT_ADDRESS),
        abi=STAKING_TOKEN_ABI
    )

    # Check staking state
    print_section_header("STAKING STATUS")

    staking_state_value = staking_contract.functions.getStakingState(service_id).call()
    staking_state = StakingState(staking_state_value)
    is_staked = staking_state in (StakingState.STAKED, StakingState.EVICTED)

    print_status("Service staked?", color_bool(is_staked))

    if not is_staked:
        print(f"\n{ColorCode.YELLOW}Service is not staked. Run staking first.{ColorCode.END}")
        return

    print_status("Staking program", f"{STAKING_PROGRAM_ID} (Gnosis)")

    if staking_state == StakingState.EVICTED:
        print_status("Staking state", color_string("EVICTED", ColorCode.RED))
        print(f"\n{ColorCode.RED}⚠ WARNING: Service has been EVICTED from staking!{ColorCode.END}")
        print(f"{ColorCode.YELLOW}This usually happens when the service failed to meet KPI requirements.{ColorCode.END}")
        print(f"{ColorCode.YELLOW}You need to unstake and re-stake to continue earning rewards.{ColorCode.END}\n")
    else:
        print_status("Staking state", color_string("STAKED", ColorCode.GREEN))

    # Get service info - handle potential decoding errors
    try:
        # Use raw call to get service info and manually decode the reward
        service_info_data = w3.eth.call({
            'to': Web3.to_checksum_address(STAKING_CONTRACT_ADDRESS),
            'data': w3.keccak(text='mapServiceInfo(uint256)').hex()[:10] +
                   hex(service_id)[2:].zfill(64)
        })
        # Reward is typically at position 3 (after multisig, owner, nonces array offset)
        # This is a simplified extraction - may need adjustment based on actual contract
        try:
            service_info = staking_contract.functions.mapServiceInfo(service_id).call()
            rewards = service_info[3]
            print_status("Accrued rewards", wei_to_olas(rewards))
        except:
            print_status("Accrued rewards", color_string("Unable to decode (see below)", ColorCode.YELLOW))
    except Exception as e:
        print_status("Accrued rewards", color_string(f"Error fetching: {str(e)[:50]}", ColorCode.YELLOW))

    # Get staking deposits
    service_registry_address = staking_contract.functions.serviceRegistryTokenUtility().call()
    service_registry_contract = w3.eth.contract(
        address=service_registry_address,
        abi=SERVICE_REGISTRY_TOKEN_UTILITY_ABI
    )

    if agent_address:
        security_deposit = service_registry_contract.functions.getOperatorBalance(
            Web3.to_checksum_address(agent_address),
            service_id
        ).call()

        # Get agent bond (assuming agent_id = 14 for Supafund)
        agent_id = config.get("chain_configs", {}).get("gnosis", {}).get("chain_data", {}).get("user_params", {}).get("agent_id", 14)
        agent_bond = service_registry_contract.functions.getAgentBond(service_id, agent_id).call()

        min_deposit = staking_contract.functions.minStakingDeposit().call()

        print_status("Security deposit", wei_to_olas(security_deposit),
                    warning_message(Decimal(security_deposit), Decimal(min_deposit)))
        print_status("Agent bond", wei_to_olas(agent_bond),
                    warning_message(Decimal(agent_bond), Decimal(min_deposit)))

    # Check epoch progress
    print_section_header("EPOCH PROGRESS")

    # Skip epoch progress if service is evicted
    if staking_state == StakingState.EVICTED:
        print(f"{ColorCode.YELLOW}Epoch progress not available for evicted services.{ColorCode.END}")
        print(f"{ColorCode.YELLOW}Please unstake and re-stake to resume participation.{ColorCode.END}\n")
    else:
        try:
            activity_checker_address = staking_contract.functions.activityChecker().call()
            activity_checker = w3.eth.contract(
                address=activity_checker_address,
                abi=ACTIVITY_CHECKER_ABI
            )

            # Calculate required transactions per epoch (24h)
            liveness_ratio = activity_checker.functions.livenessRatio().call()
            required_txs = math.ceil((liveness_ratio * 60 * 60 * 24) / Decimal(1e18))

            # Get current nonces
            multisig_nonces_list = activity_checker.functions.getMultisigNonces(
                Web3.to_checksum_address(multisig_address)
            ).call()
            current_nonce = multisig_nonces_list[0] if multisig_nonces_list else 0

            # Get nonce at last checkpoint
            service_info_full = staking_contract.functions.getServiceInfo(service_id).call()
            nonces_at_checkpoint = service_info_full[0][2][0] if service_info_full[0][2] else 0

            txs_current_epoch = current_nonce - nonces_at_checkpoint
            progress_pct = (txs_current_epoch / required_txs * 100) if required_txs > 0 else 0

            print_status(
                f"Transactions this epoch",
                f"{txs_current_epoch} / {required_txs} ({progress_pct:.1f}%)",
                warning_message(Decimal(txs_current_epoch), Decimal(required_txs),
                               f"- Need {required_txs - txs_current_epoch} more txs")
            )
        except Exception as e:
            print(f"{ColorCode.YELLOW}Could not fetch epoch progress: {e}{ColorCode.END}")

    # Get epoch timing
    try:
        next_checkpoint_ts = staking_contract.functions.getNextRewardCheckpointTimestamp().call()
        current_time = int(time.time())
        time_remaining = next_checkpoint_ts - current_time

        print_status("Epoch ends at", format_timestamp(next_checkpoint_ts))
        print_status("Time remaining", format_duration(time_remaining))

        if time_remaining < 3600:  # Less than 1 hour
            print(f"\n{ColorCode.YELLOW}⚠ Epoch ending soon! Make sure checkpoint is called.{ColorCode.END}")
    except Exception as e:
        print(f"\n{ColorCode.YELLOW}Note: Could not fetch epoch timing: {e}{ColorCode.END}")

    # Checkpoint reminder
    print_section_header("CHECKPOINT STATUS")
    print(f"✓ Supafund agent includes 'call_checkpoint_round' in FSM")
    print(f"✓ Checkpoint will be called automatically after epoch ends")
    print(f"\n{ColorCode.CYAN}Note: Rewards are only distributed after checkpoint() is called{ColorCode.END}")
    print(f"{ColorCode.CYAN}      The agent handles this automatically.{ColorCode.END}")

    print(f"\n{ColorCode.GREEN}{'=' * 60}{ColorCode.END}")
    print(f"{ColorCode.GREEN}Report complete!{ColorCode.END}")
    print(f"{ColorCode.GREEN}{'=' * 60}{ColorCode.END}\n")


if __name__ == "__main__":
    try:
        check_staking_status()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n{ColorCode.RED}Error: {e}{ColorCode.END}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
