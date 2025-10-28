#!/bin/bash

# ==============================================================================
# Pearl Middleware Daemon Startup Script
# ==============================================================================
#
# This script starts the Pearl middleware daemon using the olas-operate-middleware
# from the olas3 project directory.
#
# The daemon provides REST API endpoints that the Pearl frontend can connect to
# for managing Supafund agent services.
#
# Usage:
#   ./start_pearl_daemon.sh
#
# Requirements:
#   - Poetry installed
#   - olas-operate-middleware properly set up in olas3 directory
#
# ==============================================================================

set -e  # Exit on error

echo "════════════════════════════════════════════════════════════"
echo "  Starting Pearl Middleware Daemon for Supafund Integration"
echo "════════════════════════════════════════════════════════════"
echo ""

# Path to the middleware directory
MIDDLEWARE_DIR="/Users/andydeng/Downloads/supafund-agent/supafund-agent/olas-operate-middleware"

# Path to the quickstart workspace whose .operate directory should be managed
QUICKSTART_HOME="/Users/andydeng/Downloads/supafund-agent/supafund-agent/quickstart/.operate"

# Check if middleware directory exists
if [ ! -d "$MIDDLEWARE_DIR" ]; then
    echo "❌ Error: Middleware directory not found at $MIDDLEWARE_DIR"
    exit 1
fi

if [ ! -d "$QUICKSTART_HOME" ]; then
    echo "❌ Error: Quickstart .operate directory not found at $QUICKSTART_HOME"
    echo "   Please run ./start_supafund.sh once to generate the workspace."
    exit 1
fi

# Navigate to middleware directory
cd "$MIDDLEWARE_DIR"

# Check if poetry is installed
if ! command -v poetry &> /dev/null; then
    echo "❌ Error: Poetry is not installed!"
    echo "   Please install poetry: https://python-poetry.org/docs/#installation"
    exit 1
fi

# Set environment variables for CORS (development mode)
export OPERATE_ENABLE_CORS="true"
export OPERATE_CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"

# Set Docker socket (macOS specific)
export DOCKER_HOST=unix:///Users/andydeng/.docker/run/docker.sock

echo "Configuration:"
echo "  - Middleware dir: $MIDDLEWARE_DIR"
echo "  - Daemon port: 8000"
echo "  - Operate home: $QUICKSTART_HOME"
echo "  - CORS enabled: yes (for localhost:3000)"
echo "  - Docker socket: $DOCKER_HOST"
echo ""

echo "🚀 Starting Pearl middleware daemon..."
echo "   API will be available at: http://localhost:8000/api"
echo "   Press Ctrl+C to stop the daemon"
echo ""

# Start the daemon
# Note: Default port is 8000, so no need to specify it
poetry run python -m operate.cli daemon --home="$QUICKSTART_HOME"

# This line will only be reached if the daemon exits
echo ""
echo "✅ Daemon stopped"
