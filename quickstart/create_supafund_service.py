#!/usr/bin/env python3
"""
Create Supafund Service via API

This script creates a Supafund agent service through the Pearl middleware API.
"""

import requests
import json
import sys

API_BASE_URL = "http://localhost:8000/api/v2"

# Supafund service template based on Pearl frontend configuration
SUPAFUND_SERVICE_TEMPLATE = {
    "name": "Supafund Agent",
    "hash": "bafybeihvqgjcq2g4nauxiryholvy6tuwxxrkq7ec236tgca2b6qagy6gvu",  # Supafund hash from config
    "description": "[Pearl service] Predicts whether emerging projects will achieve key milestones",
    "image": "https://www.supafund.xyz/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flight.71a38e21.png&w=64&q=75",
    "service_version": "v0.1.0",
    "home_chain": "gnosis",
    "deploy": False,  # Create but don't auto-deploy

    "configurations": {
        "gnosis": {
            "staking_program_id": "supafund_test",
            "nft": "bafybeig64atqaladigoc3ds4arltdu63wkdrk3gesjfvnfdmz35amv7faq",
            "rpc": "https://rpc.gnosischain.com",
            "agent_id": 14,
            "threshold": 1,
            "use_staking": True,
            "use_mech_marketplace": False,
            "cost_of_bond": 1000000000000000,
            "monthly_gas_estimate": 1000000000000000000,
            "fund_requirements": {
                "0x0000000000000000000000000000000000000000": {
                    "agent": 1000000000000000000,
                    "safe": 1000000000000000000
                }
            }
        }
    },

    "env_variables": {
        "GNOSIS_LEDGER_RPC": {
            "name": "Gnosis ledger RPC",
            "value": "",
            "provision_type": "computed"
        },
        "SUPAFUND_WEIGHTS": {
            "name": "Supafund agent weights configuration",
            "description": "JSON string with weights for analysis dimensions",
            "value": "{\"founder_team\":20,\"market_opportunity\":20,\"technical_analysis\":20,\"social_sentiment\":20,\"tokenomics\":20}",
            "provision_type": "user"
        },
        "SUPAFUND_API_ENDPOINT": {
            "name": "Supafund API endpoint",
            "value": "",
            "provision_type": "user"
        },
        "MIN_EDGE_THRESHOLD": {
            "name": "Minimum edge threshold",
            "value": "5",
            "provision_type": "user"
        },
        "RISK_TOLERANCE": {
            "name": "Risk tolerance",
            "value": "5",
            "provision_type": "user"
        }
    }
}


def create_service():
    """Create Supafund service via API"""
    print("=" * 60)
    print("Creating Supafund Service")
    print("=" * 60)
    print()

    try:
        response = requests.post(
            f"{API_BASE_URL}/service",
            json=SUPAFUND_SERVICE_TEMPLATE,
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        if response.status_code == 200:
            service = response.json()
            print("✅ Supafund service created successfully!")
            print()
            print(f"Service Config ID: {service.get('service_config_id')}")
            print(f"Service Hash: {service.get('hash')}")
            print(f"Home Chain: {service.get('home_chain')}")
            print()
            print("Next steps:")
            print("1. Open browser: http://localhost:3000")
            print("2. You should see the Supafund service")
            print("3. Fund the service wallets")
            print("4. Click 'Start Service'")
            return True
        else:
            print(f"❌ Failed to create service: {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to daemon")
        print("Make sure the daemon is running:")
        print("  cd /Users/andydeng/Downloads/quickstart-main-2")
        print("  ./start_pearl_daemon.sh")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


if __name__ == "__main__":
    success = create_service()
    sys.exit(0 if success else 1)
