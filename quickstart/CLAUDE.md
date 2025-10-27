# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository contains the **OLAS Agents Quickstart**, which provides scripts to easily deploy and manage autonomous agent services built on the Open Autonomy framework. The repository structure includes:

- Root directory: User-facing quickstart scripts and configuration
- `trader-0.27.2/`: Full trader agent implementation (Open Autonomy service)

## Common Commands

### Quickstart Scripts (Root Directory)

Run an agent service:
```bash
./run_service.sh <agent_config.json>
```

Stop a running service:
```bash
./stop_service.sh <agent_config.json>
```

View live logs:
```bash
docker logs $(docker ps --filter "name=<agent_name>" --format "{{.Names}}" | grep "_abci" | head -n 1) --follow
```

Analyze agent logs and state transitions:
```bash
./analyse_logs.sh <agent_config.json> --agent=aea_0 --reset-db --fsm
```

Reset configuration:
```bash
./reset_configs.sh <agent_config.json>
```

Reset staking program:
```bash
./reset_staking.sh <agent_config.json>
```

Claim staking rewards:
```bash
./claim_staking_rewards.sh <agent_config.json>
```

Terminate on-chain service:
```bash
./terminate_on_chain_service.sh <agent_config.json>
```

### Trader Development (trader-0.27.2/)

Install dependencies:
```bash
cd trader-0.27.2
poetry install && poetry shell
```

Initialize autonomy framework:
```bash
autonomy init --reset --author valory --remote --ipfs --ipfs-node "/dns/registry.autonolas.tech/tcp/443/https"
```

Sync packages:
```bash
autonomy packages sync --update-packages
```

Format code:
```bash
make format
```

Run code checks (linting, type checking):
```bash
make code-checks
```

Run security checks:
```bash
make security
```

Run all checks:
```bash
make all-checks
```

Clean build artifacts:
```bash
make clean
```

Run tests (requires tox):
```bash
tox -e py3.10-darwin  # For macOS
tox -e py3.10-linux   # For Linux
```

Run specific skill tests:
```bash
pytest -rfE packages/valory/skills/decision_maker_abci/tests --cov=packages/valory/skills/decision_maker_abci
```

Build agent runner binary:
```bash
make build-agent-runner
```

## Architecture

### Multi-Repository Structure

This repository is a quickstart wrapper around the trader service. The actual service code is in `trader-0.27.2/`, which is a snapshot of the trader service from the valory-xyz/trader repository.

### Agent Service Architecture

OLAS agents are built on the **Open Autonomy framework** and follow the **ABCI (Application Blockchain Interface)** pattern. Key architectural components:

**FSM-based Skills**: Each agent service is composed of skills that implement finite state machines (FSMs). The service transitions through different rounds/states to accomplish tasks.

**Core Skills** (in `packages/valory/skills/`):
- `trader_abci`: Main orchestration skill that composes other skills
- `decision_maker_abci`: Handles betting decisions based on AI Mech predictions
- `market_manager_abci`: Manages prediction market discovery and selection
- `staking_abci`: Handles staking program interactions
- `tx_settlement_multiplexer_abci`: Manages transaction settlement across different contexts
- `check_stop_trading_abci`: Monitors conditions for stopping trading

**Component Structure**: Each skill contains:
- `behaviours.py`: FSM round behaviors (what the agent does in each state)
- `rounds.py`: Round definitions and state transitions
- `payloads.py`: Data payloads exchanged between agents
- `models.py`: Shared parameters and state
- `handlers.py`: Message handlers
- `dialogues.py`: Dialogue management
- `fsm_specification.yaml`: FSM specification for validation
- `skill.yaml`: Skill configuration

**Custom Strategies** (in `packages/*/customs/`):
- `jhehemann/kelly_criterion`: Kelly criterion betting strategy
- `valory/bet_amount_per_threshold`: Threshold-based betting amounts
- `valory/mike_strat`: Mike's strategy implementation
- `w1kke/always_blue`: Simple always-bet-blue strategy

### Package Management

Uses **Open Autonomy** package management system:
- Packages are IPFS-addressed and version-controlled via hashes
- `packages/packages.json`: Maps package paths to IPFS hashes
- `autonomy packages sync`: Syncs packages from remote repositories
- `autonomy packages lock`: Locks package versions

### Configuration System

Agent configurations are JSON files (in `configs/`) defining:
- Service metadata (name, hash, description, version)
- Chain-specific settings (agent_id, threshold, fund requirements)
- Environment variables with provision types:
  - `user`: Prompted from CLI at runtime
  - `fixed`: Static value from config
  - `computed`: Set by quickstart based on other settings

Supported agents: Trader, Mech, Optimus, Modius, Agents.fun

## Development Workflow

### Creating Custom Strategies

Custom betting strategies go in `packages/<author>/customs/<strategy_name>/`:
1. Create strategy module with implementation
2. Add `component.yaml` with metadata
3. Update the service configuration to use the strategy

### Modifying FSM Behavior

When changing FSM specifications:
1. Update the relevant skill's FSM implementation
2. Regenerate specs: `make fix-abci-app-specs`
3. Validate: `tox -e check-abciapp-specs`

### Running Tests

Tests are organized by skill. Run specific skill tests or use tox for comprehensive testing across Python versions and platforms.

### Code Quality

The project uses `tomte` for code quality tools:
- Black for formatting
- isort for import ordering
- flake8 for linting
- mypy for type checking
- pylint for code analysis
- darglint for docstring linting
- bandit for security linting

## Key Technical Details

**Python Version**: Requires Python 3.10 (3.9-3.11 supported for testing)

**Multi-Agent Operation**: Services can run with multiple agents (default is single agent). For multi-agent:
- Provide multiple keys in `keys.json`
- Register all agents in the service Safe
- Set `ALL_PARTICIPANTS` with all agent addresses
- Provide RPC endpoints for each agent

**Docker Deployments**: Services are deployed as Docker Compose stacks. The build process also generates Kubernetes deployments in `abci_build_k8s/`.

**Blockchain Integration**:
- Services interact with smart contracts via Web3
- Gnosis Safe is used for multi-sig wallet management
- Supports multiple chains via RPC configuration

**AI Integration**: Services request predictions from AI Mech, a separate autonomous service that executes AI tasks.
