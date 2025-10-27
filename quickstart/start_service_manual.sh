#!/bin/bash

# Manual service start script
# Use this to start a service via API when the UI fails

set -e

SERVICE_ID="${1:-sc-7dc1d326-0f62-4816-bf02-e285d84be042}"

echo "Starting service: $SERVICE_ID"

# Start the service
curl -X POST "http://localhost:8000/api/v2/service/$SERVICE_ID" \
  -H "Content-Type: application/json" \
  -v

echo ""
echo "Service start command sent"
echo ""
echo "Check status with:"
echo "  curl http://localhost:8000/api/v2/services | python3 -m json.tool"
echo ""
echo "Check Docker containers:"
echo "  docker ps"
