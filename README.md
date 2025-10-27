# Supafund Agent Quickstart

This repository bundles everything needed to run the Supafund agent locally:

- the Python-based **Pearl middleware daemon** (`olas-operate-middleware/`)
- the original **OLAS quickstart scripts** (`quickstart/`)
- the Supafund **Next.js frontend** (`frontend/`)

Use the quickstart scripts to spin up an OLAS service instance, expose it through the middleware daemon, and interact with it via the Pearl web UI.

---

## Repository Structure

- `quickstart/` – orchestration scripts, configuration files, and helper utilities for running OLAS services locally (creates `.operate/` state).
- `olas-operate-middleware/` – Poetry project that serves the Operate daemon on port `8000`.
- `frontend/` – Next.js app that connects to the daemon at `http://localhost:8000/api` and renders the Supafund UI.

---

## Prerequisites

| Tool | Notes |
| --- | --- |
| Python 3.10.x | Recommended to install via [`pyenv`](https://github.com/pyenv/pyenv). |
| [Poetry](https://python-poetry.org/) ≥ 1.8.3 | Used to manage the middleware environment. |
| Docker & Docker Compose | Required by the OLAS services started from `quickstart/`. |
| Node.js ≥ 18.17 & Yarn (Classic) | Needed for the Next.js frontend (`frontend/`). |

> 💡 Tip: if `python3.10` is not already available, install it with `pyenv install 3.10.14` and ensure it is on your `PATH` before running `poetry env use`.

---

## Setup

### 1. Install middleware dependencies

```bash
cd olas-operate-middleware
poetry env use 3.10     # make sure Poetry selects Python 3.10.x
poetry install          # installs all locked dependencies
```

The command above creates a virtualenv at `~/.cache/pypoetry/virtualenvs/...-py3.10`. All later `poetry run …` calls (including the daemon script) reuse this environment.

### 2. Prepare the OLAS quickstart workspace

```bash
cd ../quickstart
./start_supafund.sh
```

What this does:

- populates `.operate/` with Supafund service configuration (`configs/config_supafund.json`)
- prompts for Supafund API credentials unless `SUPAFUND_API_ENDPOINT` is exported
- ensures Docker containers and required permissions are in place

You can tweak defaults before running:

```bash
export SUPAFUND_WEIGHTS='{"founder_team":25,"market_opportunity":15,"technical_analysis":20,"social_sentiment":20,"tokenomics":20}'
export MIN_EDGE_THRESHOLD=5
export RISK_TOLERANCE=5
```

To stop the service later, run:

```bash
./stop_service.sh configs/config_supafund.json
```

### 3. Launch the Pearl middleware daemon

Before running, make sure the path constants at the top of `quickstart/start_pearl_daemon.sh` match your local checkout location. By default they point to `/Users/andydeng/Downloads/supafund-agent/...`; adjust `MIDDLEWARE_DIR` and `QUICKSTART_HOME` if you moved the repository or renamed the folder.

```bash
cd quickstart
./start_pearl_daemon.sh
```

The daemon:

- uses the Poetry environment from `olas-operate-middleware/`
- serves the Operate API at `http://localhost:8000/api`
- enables CORS for the frontend (`localhost:3000`)

If you get `address already in use`, free the port first:

```bash
lsof -i :8000        # find the blocking PID
kill <pid>
```

You can verify the daemon with:

```bash
curl http://localhost:8000/api/health
```

### 4. Run the frontend

```bash
cd ../frontend
cp .env.local .env.local.backup   # optional safe copy before editing
# customise RPC URLs inside .env.local if needed
yarn install
yarn dev
```

Open http://localhost:3000 once the dev server reports that it is ready. The frontend automatically targets the daemon at `http://localhost:8000/api`.

Use `Ctrl+C` to stop the frontend and the daemon when you are done.

---

## Useful Commands

- **Restart the Supafund agent service**
  ```bash
  cd quickstart
  ./start_supafund.sh
  ```
- **Reset service configuration prompts**
  ```bash
  ./reset_configs.sh configs/config_supafund.json
  ```
- **Analyse service logs**
  ```bash
  ./analyse_logs.sh configs/config_supafund.json --agent=aea_0 --fsm
  ```
- **Middleware tests**
  ```bash
  cd olas-operate-middleware
  poetry run pytest
  ```
- **Frontend lint + tests**
  ```bash
  cd frontend
  yarn lint
  yarn test
  ```

---

## Troubleshooting

- **Poetry selects Python 3.12 by default**
  
  Run `poetry env use 3.10` inside `olas-operate-middleware/` before installing dependencies. Poetry will reuse the saved interpreter for future runs.

- **Daemon exits with `address already in use`**
  
  Another process is bound to port `8000`. Identify and kill it via `lsof -i :8000`.

- **Frontend cannot reach the API (`CORS` or `Network Error`)**
  
  Make sure the daemon is running and accessible at `http://localhost:8000/api`. The daemon script enables localhost CORS; restarting it usually resolves stale connections.

- **Docker containers fail to start**
  
  Confirm Docker Desktop is running (on macOS) and that `$DOCKER_HOST` is set correctly. The quickstart scripts assume `unix:///Users/<user>/.docker/run/docker.sock`; adjust if yours differs.

---

## Next Steps

- Configure additional OLAS agents by editing files under `quickstart/configs/`.
- Extend the frontend by modifying components in `frontend/`.
- Package or deploy the daemon by using `poetry build` within `olas-operate-middleware/`.

Happy hacking! If you run into issues, check the extensive docs inside the `quickstart/` folder (e.g. `PEARL_INTEGRATION.md`, `TROUBLESHOOTING_REPORT.md`) for deeper dives.
