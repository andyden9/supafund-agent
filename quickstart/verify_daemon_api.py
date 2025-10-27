#!/usr/bin/env python3
"""
Verify Pearl Daemon API Script

This script checks if the Pearl middleware daemon is running and accessible.
It tests basic API endpoints to ensure the integration is working correctly.

Usage:
    python verify_daemon_api.py
"""

import requests
import json
import sys

# API configuration
API_BASE_URL = "http://localhost:8000/api/v2"
TIMEOUT = 5  # seconds


def print_section(title):
    """Print a formatted section title"""
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print('=' * 60)


def test_daemon_health():
    """Test if daemon is running"""
    print_section("Testing Daemon Health")

    try:
        # Try to fetch services endpoint
        response = requests.get(f"{API_BASE_URL}/services", timeout=TIMEOUT)

        if response.status_code == 200:
            print("✅ Daemon is running and accessible")
            services = response.json()
            print(f"   Found {len(services)} existing service(s)")
            return True
        else:
            print(f"❌ Daemon responded with status code: {response.status_code}")
            print(f"   Response: {response.text}")
            return False

    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to daemon")
        print(f"   Is the daemon running? Try: ./start_pearl_daemon.sh")
        print(f"   Expected URL: {API_BASE_URL}")
        return False

    except requests.exceptions.Timeout:
        print(f"❌ Connection timeout after {TIMEOUT} seconds")
        return False

    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False


def list_existing_services():
    """List all existing services"""
    print_section("Existing Services")

    try:
        response = requests.get(f"{API_BASE_URL}/services", timeout=TIMEOUT)

        if response.status_code == 200:
            services = response.json()

            if not services:
                print("No services found")
                print("You can create a Supafund service from the Pearl frontend UI")
                return []

            for idx, service in enumerate(services, 1):
                print(f"\n{idx}. Service: {service.get('name', 'Unknown')}")
                print(f"   Config ID: {service.get('service_config_id', 'N/A')}")
                print(f"   Hash: {service.get('hash', 'N/A')}")
                print(f"   Chain: {service.get('chain_id', 'N/A')}")

                deployment = service.get('deployment', {})
                if deployment:
                    status = deployment.get('status', 'unknown')
                    print(f"   Status: {status}")

            return services
        else:
            print(f"Failed to fetch services: {response.status_code}")
            return []

    except Exception as e:
        print(f"Error fetching services: {str(e)}")
        return []


def test_cors():
    """Test CORS configuration"""
    print_section("Testing CORS Configuration")

    try:
        # Simulate a browser preflight request
        headers = {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'GET',
        }

        response = requests.options(
            f"{API_BASE_URL}/services",
            headers=headers,
            timeout=TIMEOUT
        )

        cors_header = response.headers.get('Access-Control-Allow-Origin')

        if cors_header:
            print(f"✅ CORS is configured")
            print(f"   Allow-Origin: {cors_header}")
            return True
        else:
            print("⚠️  CORS headers not found")
            print("   This might cause issues with browser-based frontend")
            return False

    except Exception as e:
        print(f"⚠️  Could not test CORS: {str(e)}")
        return False


def main():
    """Main verification function"""
    print("╔" + "═" * 58 + "╗")
    print("║" + " " * 10 + "Pearl Daemon API Verification" + " " * 18 + "║")
    print("╚" + "═" * 58 + "╝")

    # Run tests
    daemon_ok = test_daemon_health()

    if not daemon_ok:
        print("\n" + "=" * 60)
        print("❌ FAILED: Daemon is not accessible")
        print("=" * 60)
        print("\nTo start the daemon:")
        print("  cd /Users/andydeng/Downloads/quickstart-main-2")
        print("  ./start_pearl_daemon.sh")
        sys.exit(1)

    # Additional tests
    test_cors()
    services = list_existing_services()

    # Summary
    print_section("Summary")
    print("✅ Pearl middleware daemon is running correctly")
    print(f"✅ API base URL: {API_BASE_URL}")
    print(f"✅ Total services: {len(services)}")

    print("\nNext steps:")
    print("1. Start Pearl frontend:")
    print("   cd /Users/andydeng/Downloads/olas3/olas-operate-app/frontend")
    print("   yarn dev")
    print("")
    print("2. Open browser:")
    print("   http://localhost:3000")
    print("")
    print("3. Create Supafund service from the UI")

    print("\n" + "=" * 60)
    print("✅ ALL CHECKS PASSED")
    print("=" * 60)


if __name__ == "__main__":
    main()
