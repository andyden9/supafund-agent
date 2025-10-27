# Pearl Frontend + Quickstart Backend Integration Guide

## Overview

This integration allows you to run the Pearl Supafund frontend in a browser while using the Pearl middleware daemon (from the olas-operate-middleware project) to manage agent services. This provides a hybrid approach that combines:

- **Pearl middleware daemon**: Provides REST API for service management
- **Quickstart configuration**: Uses the quickstart's Supafund configuration
- **Browser-based frontend**: Pearl UI accessed through a web browser (no Electron app)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Browser (localhost:3000)                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Pearl Frontend (Next.js)                                │ │
│ │ - Supafund UI                                           │ │
│ │ - Service management                                    │ │
│ │ - Configuration updates                                 │ │
│ └────────────────────┬────────────────────────────────────┘ │
└──────────────────────┼──────────────────────────────────────┘
                       │ HTTP REST API
┌──────────────────────▼──────────────────────────────────────┐
│ Pearl Middleware Daemon (localhost:8000)                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ FastAPI Server                                          │ │
│ │ - /api/v2/services (list, create, update, delete)      │ │
│ │ - /api/v2/service/{id} (start, stop, status)           │ │
│ │ - CORS enabled for browser access                      │ │
│ └────────────────────┬───────────────────────────────────┘ │
└──────────────────────┼──────────────────────────────────────┘
                       │ Manages lifecycle
┌──────────────────────▼──────────────────────────────────────┐
│ Supafund Agent (Docker Containers)                          │
│ ┌──────────────────┐  ┌──────────────────────────────────┐ │
│ │ Tendermint       │  │ Agent Process                    │ │
│ │ (localhost:8080) │  │ - Healthcheck: localhost:8716    │ │
│ │                  │  │ - Persistent data in .operate/   │ │
│ └──────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

### System Requirements
- macOS (tested) or Linux
- Docker Desktop running
- Python 3.9-3.11 (NOT 3.12)
- Node.js >= 20
- Poetry 1.8.5
- Yarn >= 1.22.0

### Directory Structure
```
/Users/andydeng/Downloads/
├── quickstart-main-2/              # This directory
│   ├── configs/config_supafund.json
│   ├── start_pearl_daemon.sh       # NEW: Daemon startup script
│   └── verify_daemon_api.py        # NEW: API verification script
│
└── olas3/
    ├── olas-operate-middleware/    # Pearl middleware
    │   └── operate/cli.py
    └── olas-operate-app/           # Pearl app
        └── frontend/               # Pearl frontend
            ├── .env.local          # NEW: Frontend config
            └── package.json
```

## Quick Start

### Step 1: Start the Pearl Middleware Daemon

Open a terminal and run:

```bash
cd /Users/andydeng/Downloads/quickstart-main-2
./start_pearl_daemon.sh
```

**What this does:**
- Navigates to the middleware directory
- Starts the FastAPI daemon on port 8000
- Enables CORS for browser access
- Provides REST API for service management

**Expected output:**
```
════════════════════════════════════════════════════════════
  Starting Pearl Middleware Daemon for Supafund Integration
════════════════════════════════════════════════════════════

Configuration:
  - Middleware dir: /Users/andydeng/Downloads/olas3/olas-operate-middleware
  - Daemon port: 8000
  - CORS enabled: yes (for localhost:3000)

🚀 Starting Pearl middleware daemon...
   API will be available at: http://localhost:8000/api
```

**Keep this terminal open** - the daemon needs to keep running.

### Step 2: Verify the Daemon (Optional but Recommended)

Open a second terminal:

```bash
cd /Users/andydeng/Downloads/quickstart-main-2
python3 verify_daemon_api.py
```

This will test:
- ✅ Daemon is accessible
- ✅ CORS is configured
- ✅ API endpoints respond correctly

**Expected output:**
```
╔══════════════════════════════════════════════════════════╗
║          Pearl Daemon API Verification                   ║
╚══════════════════════════════════════════════════════════╝

============================================================
  Testing Daemon Health
============================================================
✅ Daemon is running and accessible
   Found 0 existing service(s)

============================================================
✅ ALL CHECKS PASSED
============================================================
```

### Step 3: Start the Pearl Frontend

Open a third terminal:

```bash
cd /Users/andydeng/Downloads/olas3/olas-operate-app/frontend
yarn dev
```

**Expected output:**
```
  ▲ Next.js 14.2.3
  - Local:        http://localhost:3000

 ✓ Ready in 3.5s
```

### Step 4: Open the Browser

Open your web browser and navigate to:

```
http://localhost:3000
```

You should see the Pearl interface!

## Using the Integration

### Creating a Supafund Service

1. In the browser, you should see the Pearl interface
2. If there are no services:
   - Click on "Create Service" or similar
   - Select "Supafund Agent"
   - Follow the setup wizard

3. The frontend will call the middleware API to create the service
4. The middleware will:
   - Create service configuration in `.operate/services/`
   - Set up the Supafund agent
   - Prepare Docker deployment

### Starting the Service

1. Once the service is created, click "Start Service"
2. The middleware will:
   - Start Tendermint process
   - Start the Agent in Docker containers
   - Begin monitoring via healthcheck

3. You can monitor:
   - Service status
   - Agent logs
   - Staking rewards
   - Configuration

### Updating Configuration

1. Navigate to the Supafund configuration section
2. Modify weights, thresholds, or other parameters
3. Click "Save" or "Update"
4. The frontend will:
   - Call `PATCH /api/v2/service/{id}`
   - Update environment variables
   - Optionally restart the service

### Stopping the Service

1. Click "Stop Service"
2. The middleware will:
   - Gracefully stop Tendermint
   - Stop Docker containers
   - Preserve service state in `.operate/`

## Troubleshooting

### Daemon Won't Start

**Problem:** `./start_pearl_daemon.sh` fails

**Solutions:**
1. Check if Poetry is installed: `poetry --version`
2. Check if middleware directory exists
3. Try installing dependencies manually:
   ```bash
   cd /Users/andydeng/Downloads/olas3/olas-operate-middleware
   poetry install
   ```

### Frontend Can't Connect to Daemon

**Problem:** Browser shows connection errors

**Solutions:**
1. Verify daemon is running: `curl http://localhost:8000/api/v2/services`
2. Check CORS: `python3 verify_daemon_api.py`
3. Make sure port 8000 is not in use:
   ```bash
   lsof -ti:8000
   # If something is using it, kill it:
   lsof -ti:8000 | xargs kill -9
   ```

### Service Won't Start

**Problem:** Service creation succeeds but won't start

**Solutions:**
1. Check Docker is running: `docker ps`
2. Check daemon logs in terminal 1
3. Look for errors in:
   ```bash
   cat .operate/services/sc-*/deployment/agent/log.txt
   ```

### Port Conflicts

**Problem:** Port 8000, 3000, 8080, or 8716 already in use

**Solutions:**
```bash
# Check what's using the port
lsof -ti:8000  # or 3000, 8080, 8716

# Kill the process
lsof -ti:8000 | xargs kill -9
```

### CORS Errors in Browser Console

**Problem:** Browser shows CORS policy errors

**Solutions:**
1. Verify daemon was started with CORS enabled (check terminal 1)
2. The middleware has CORS enabled by default (allow_origins=["*"])
3. Try clearing browser cache and reloading

### Environment Variables Not Working

**Problem:** RPC endpoints or configuration not loading

**Solutions:**
1. Check `.env.local` file exists in frontend directory
2. Restart the frontend dev server (Ctrl+C and `yarn dev` again)
3. Next.js only loads `.env.local` on startup

## File Locations

### Logs
- **Daemon logs**: Terminal 1 (where you ran `start_pearl_daemon.sh`)
- **Frontend logs**: Terminal 3 (where you ran `yarn dev`)
- **Agent logs**: `.operate/services/sc-<uuid>/deployment/agent/log.txt`

### Service Data
- **Service configs**: `.operate/services/sc-<uuid>/`
- **Persistent data**: `.operate/services/sc-<uuid>/persistent_data/`
- **Deployment**: `.operate/services/sc-<uuid>/deployment/`
- **Private key**: `.operate/services/sc-<uuid>/deployment/ethereum_private_key.txt`

### Configuration
- **Frontend env**: `olas-operate-app/frontend/.env.local`
- **Service template**: `olas-operate-app/frontend/constants/serviceTemplates.ts`
- **Quickstart config**: `quickstart-main-2/configs/config_supafund.json`

## Advanced Usage

### Viewing Service Details

To inspect a service via API:

```bash
# List all services
curl http://localhost:8000/api/v2/services

# Get specific service
curl http://localhost:8000/api/v2/service/YOUR_SERVICE_CONFIG_ID
```

### Checking Agent Health

```bash
# Check agent healthcheck endpoint
curl http://localhost:8716/healthcheck
```

### Manual Service Management

You can also manage services via the quickstart scripts:

```bash
cd /Users/andydeng/Downloads/quickstart-main-2

# Stop service
./stop_service.sh configs/config_supafund.json

# View logs
./analyse_logs.sh configs/config_supafund.json
```

## Stopping Everything

### Graceful Shutdown

1. Stop the service from the frontend UI
2. Stop the frontend: Ctrl+C in terminal 3
3. Stop the daemon: Ctrl+C in terminal 1

### Force Stop

If something is stuck:

```bash
# Kill the daemon
lsof -ti:8000 | xargs kill -9

# Stop Docker containers
docker stop $(docker ps -q --filter "name=abci")
docker stop $(docker ps -q --filter "name=tm")

# Kill the frontend
lsof -ti:3000 | xargs kill -9
```

## Differences from Full Pearl App

This integration differs from the full Pearl Electron app in:

1. **No Electron**: Runs in browser, not as desktop app
2. **Manual daemon start**: Must start daemon manually (not auto-started)
3. **Development mode**: Always uses port 8000 (not 8765)
4. **Configuration**: Uses quickstart configs as reference

## Integration with Official Pearl

This setup is fully compatible with the official Pearl architecture:

- ✅ Uses official Pearl middleware (olas-operate-middleware)
- ✅ Uses official Pearl frontend code (olas-operate-app/frontend)
- ✅ Follows official Agent architecture requirements
- ✅ REST API is identical to Pearl Electron app
- ✅ Can switch to Electron app anytime (same data format)

## Next Steps

1. **Test the integration**: Follow the Quick Start guide
2. **Create a Supafund service**: Use the frontend UI
3. **Monitor performance**: Check agent logs and status
4. **Customize configuration**: Adjust weights and parameters
5. **Report issues**: Document any problems you encounter

## Support

For issues or questions:
- Check the troubleshooting section above
- Review daemon logs (terminal 1)
- Run `python3 verify_daemon_api.py`
- Check official Pearl docs: https://docs.olas.network/

## Files Created by This Integration

- `start_pearl_daemon.sh` - Daemon startup script
- `verify_daemon_api.py` - API verification tool
- `PEARL_INTEGRATION.md` - This document
- `olas-operate-app/frontend/.env.local` - Frontend config
