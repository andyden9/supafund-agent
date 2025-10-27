# Repository Guidelines

## Project Structure & Module Organization
The quickstart is anchored around `run_service.sh`, `stop_service.sh`, and helper scripts in the repository root that orchestrate Docker-backed OLAS agents. Agent templates and environment profiles live in `configs/*.json`; clone an existing config when onboarding a new operator. Service-specific logic is grouped under `scripts/`, with separate subpackages (`predict_trader`, `mech`, `optimus`, `modius`) and shared helpers in `scripts/utils.py`. Integration-style regression tests reside in `tests/`, while staking collateral examples and generated artifacts are kept under `data/` and `trader-0.27.2/`.

## Build, Test, and Development Commands
Use `poetry install` or `make install` to pull main dependencies, and `make test-install` when you need dev-only tooling. Start an agent locally with `./run_service.sh configs/config_predict_trader.json` (substitute your config), and stop it with `./stop_service.sh <agent_config.json>`. To inspect runtime behaviour, run `./analyse_logs.sh <agent_config.json> --agent=aea_0 --reset-db`. Execute the focused regression used in CI with `make run_no_staking_tests`, or run the whole suite via `make test`.

## Coding Style & Naming Conventions
Python modules follow PEP 8: four-space indentation, `snake_case` for modules and functions, and clear type hints for new public APIs. Keep shell scripts POSIX-friendly and document optional flags inline. Name new config files `config_<agent>.json` to match the lookups in automation code, and mirror that naming in any screenshots or instructions you add. Run `poetry run python -m compileall scripts` before committing complex changes to catch syntax issues early.

## Testing Guidelines
Pytest powers the suite; place new cases in `tests/` using the `test_*.py` convention so `make run_no_staking_tests` picks them up. Use fixtures to stub Docker and network calls instead of hitting live infrastructure. When adding a new agent config, cover happy-path startup plus failure mode logging. Prefer `poetry run pytest -k <marker> --maxfail=1` locally to iterate quickly, then finish with `make test` before raising a pull request.

## Commit & Pull Request Guidelines
Commits should be concise, present-tense summaries such as `add supafund agent config`; squash noisy WIP history before opening a PR. Each PR must describe the scenario it enables, list configs or scripts touched, and reference any Jira/GitHub issue. Attach log excerpts or screenshots when you change runtime behaviour. Confirm `make test` passes and note any skipped scenarios so reviewers can reproduce your setup.
