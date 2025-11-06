# Supafund Agent Quickstart

本仓库整合了 Supafund 服务在本地运行所需的全部内容。核心体验遵循 Juli 的指导：只要执行一个 Quickstart 脚本即可启动 OLAS 服务和 Supafund UI，随后直接访问 <http://localhost:8716> 操作，无需额外的 Pearl/前端登陆流程。

---

## 目录结构概览

- `quickstart/` – 官方 OLAS Quickstart 脚本及 Supafund 配置（会在 `.operate/` 下生成运行状态与日志）。
- `supafund-trader/` – Supafund 自定义的 agent/service 包（与 `packages.json`、IPFS hash 对齐）。
- `frontend/` – **可选** 的 Next.js 辅助界面（调试时使用，默认体验无需启动）。

---

## 环境要求

| 组件 | 说明 |
| --- | --- |
| Python 3.10.x | 可通过 [`pyenv`](https://github.com/pyenv/pyenv) 安装。Quickstart 使用 Poetry 调用 Python。|
| [Poetry](https://python-poetry.org/) ≥ 1.8.3 | 管理 Python 依赖与虚拟环境。|
| Docker Desktop / Colima + Docker Compose | 运行 OLAS 服务容器。|

> 💡 提示：若系统默认找到的是 Python 3.12，可先执行 `poetry env use 3.10` 让 Poetry 绑定到 3.10.x。

---

## 一键启动 Supafund 服务

```bash
cd quickstart
./start_supafund.sh
```

脚本会完成以下操作：

1. 确认 Docker 可用，自动拉取并标记镜像 `supafund/oar-trader:bafybeicnqcdvfaox54q5dczwnx6shwrbvcezi3egy7urtaehi6csmd423y`。若本地已有则跳过。
2. 安装 Poetry 依赖，执行官方 `operate quickstart` 流程，生成 `.operate/` 数据。
3. 在后台自动启动 Supafund Quickstart 后端（端口默认为 `0.0.0.0:8000`，日志写入 `.operate/supafund_backend.log`）。
4. 按提示输入 Supafund API 或资金信息；资金检测通过后容器会启动。

脚本结束后：

- Supafund agent 在 Docker 中运行，健康检查与 log 写入 `/data`（由服务模板映射到 `.operate/services/.../persistent_data`）。
- 后端接口 `http://localhost:8000/api/...` 已就绪，提供服务校验、钱包信息等 API。
- 访问 <http://localhost:8716> 即可看到 Supafund 自带 UI（内嵌在服务容器的 HTTP 服务器里）。

### 常用环境变量

可在运行前通过环境变量覆盖默认值：

```bash
export SUPAFUND_API_ENDPOINT="https://api.supafund.example"
export SUPAFUND_WEIGHTS='{"founder_team":20,"market_opportunity":20,"technical_analysis":20,"social_sentiment":20,"tokenomics":20}'
export MIN_EDGE_THRESHOLD=5
export RISK_TOLERANCE=5
export BACKEND_HOST=0.0.0.0     # 可选：Supafund 后端监听地址
export BACKEND_PORT=8000        # 可选：Supafund 后端监听端口
```

脚本运行时会打印当前环境变量值，便于确认。

### 停止服务与清理

- 停止 agent：
  ```bash
  cd quickstart
  ./stop_service.sh configs/config_supafund.json
  ```
- 重启 Supafund 后端（如需单独启动）：
  ```bash
  cd quickstart
  ./start_backend.sh
  ```
  后端 PID 记录在 `.operate/supafund_backend.pid`，日志位于 `.operate/supafund_backend.log`。

---

## 访问 UI 与健康检查

- **主界面**：<http://localhost:8716>（来自服务包 `service.yaml` 的端口映射）。该界面应展示 Supafund 的策略看板、资金状态等内容。
- **Operate API**：<http://localhost:8000/api/>（Quickstart 自动启动，无需手动运行 middleware 仓库）。  
  常用接口：`/api/health`、`/api/wallet`、`/api/v2/services`、`/api/v2/services/validate`。
- **健康检查 JSON**：服务容器的 `/healthcheck` 响应包含 Pearl 官方要求的字段（`is_healthy`、`seconds_since_last_transition`、`agent_health` 等），Quickstart 会用它判定状态。

---

## 可选：Next.js 前端（调试用途）

仓库仍保留了 React/Next.js 版本的 Supafund UI（端口 3000）。默认体验不需要它，但如需调试可按以下步骤启动：

```bash
cd frontend
yarn install
yarn dev
```

开发服默认调用 `http://localhost:8000/api`，与自动启动的 Supafund 后端兼容。

---

## 排错指南

- **资金检测一直等待**：确认已把 xDAI 充值到提示的最新 Master EOA 地址（每次启动都会变化），且在 Gnosis 链上。可使用 gnosisscan 查询余额。
- **端口占用**：若脚本提示 `address already in use`，使用 `lsof -i :8000` 或 `lsof -i :8716` 查找并终止冲突进程。
- **后端未能启动**：检查 `.operate/supafund_backend.log`，确认 Poetry 环境正常或端口无占用。
- **Docker 网络残留**：脚本会自动清理名称包含 `service_traderPdWj_localnet` 的网络；如有其他残留，可手动执行 `docker network prune`。

---

## 参考文档

- [Pearl: Integrating Your AI Agent](docs/Pearl_Integrating_Agent.pdf) – 官方对 healthcheck、日志格式、STORE_PATH 等要求。
- [Agent Integration Checklist](docs/Pearl_Agent_Checklist.pdf) – 包含 staking、环境变量、IPFS hash、镜像发布等核对项。
- [docs/docker_image_publish.md](quickstart/docs/docker_image_publish.md) – 如何构建/推送 `supafund/oar-trader:<hash>` 镜像。

完成上述流程后，即可通过 Quickstart 自动化步骤运行 Supafund agent，并在 8716 端口查看/控制服务。默认无需额外的 Pearl 登录或手工 daemon。欢迎在 `.operate/` 中查看具体的服务与日志文件。祝使用愉快！
  
  Confirm Docker Desktop is running (on macOS) and that `$DOCKER_HOST` is set correctly. The quickstart scripts assume `unix:///Users/<user>/.docker/run/docker.sock`; adjust if yours differs.

---

## Next Steps

- Configure additional OLAS agents by editing files under `quickstart/configs/`.
- Extend the frontend by modifying components in `frontend/`.
- Package or deploy the daemon by using `poetry build` within `olas-operate-middleware/`.

Happy hacking! If you run into issues, check the extensive docs inside the `quickstart/` folder (e.g. `PEARL_INTEGRATION.md`, `TROUBLESHOOTING_REPORT.md`) for deeper dives.
