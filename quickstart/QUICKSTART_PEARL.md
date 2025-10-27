# Quick Start: Pearl Frontend + Supafund Backend

## 🚀 Three Steps to Run

### 1. Start Daemon (Terminal 1)
```bash
cd /Users/andydeng/Downloads/quickstart-main-2
./start_pearl_daemon.sh
```
Keep this terminal open.

### 2. Start Frontend (Terminal 2)
```bash
cd /Users/andydeng/Downloads/olas3/olas-operate-app/frontend
yarn dev
```

### 3. Open Browser
```
http://localhost:3000
```

## ✅ Verify Everything Works

```bash
cd /Users/andydeng/Downloads/quickstart-main-2
python3 verify_daemon_api.py
```

## 📁 What Was Set Up

| File | Purpose |
|------|---------|
| `start_pearl_daemon.sh` | Start Pearl middleware daemon |
| `verify_daemon_api.py` | Test if daemon is working |
| `PEARL_INTEGRATION.md` | Full documentation |
| `olas-operate-app/frontend/.env.local` | Frontend configuration |

## 🏗️ Architecture

```
Browser (localhost:3000)
    ↓ REST API
Pearl Daemon (localhost:8000)
    ↓ Manages
Supafund Agent (Docker)
```

## 🔧 Common Commands

```bash
# Verify daemon is running
curl http://localhost:8000/api/v2/services

# Check agent health (when service is running)
curl http://localhost:8716/healthcheck

# Stop service (from UI or command line)
./stop_service.sh configs/config_supafund.json

# View logs
cat .operate/services/sc-*/deployment/agent/log.txt
```

## ❓ Problems?

### Daemon won't start
```bash
cd /Users/andydeng/Downloads/olas3/olas-operate-middleware
poetry install
```

### Port conflict
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

### Can't connect
1. Make sure daemon is running (terminal 1 shows output)
2. Run `python3 verify_daemon_api.py`
3. Check Docker is running: `docker ps`

## 📚 Full Documentation

See **[PEARL_INTEGRATION.md](./PEARL_INTEGRATION.md)** for:
- Detailed architecture
- Troubleshooting guide
- Advanced usage
- File locations
- Complete reference

## 🎯 Next Steps

1. ✅ Run the three commands above
2. ✅ Open http://localhost:3000 in browser
3. ✅ Create a Supafund service from UI
4. ✅ Start the service and monitor it

## 💡 Tips

- **Keep terminal 1 open** - daemon must keep running
- **Use browser dev tools** - check console for errors
- **Check daemon logs** - terminal 1 shows API requests
- **Service data** - stored in `.operate/services/`

---

**Ready to start?** Run the three commands above! 🎉
