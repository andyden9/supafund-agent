# Supafund Agent 快速启动指南

本仓库提供运行 Supafund 预测代理所需的全部组件：

- `quickstart/`：基于 OLAS 官方 quickstart 的脚本与配置，负责启动链上服务与容器。
- `frontend/`：Supafund 专用的 Next.js 前端代码（供本地开发或打包 UI 资源）。

通过 quickstart 可在本地一键拉起服务，并在浏览器访问 Supafund 控制台。

---

## 系统要求

| 工具 | 说明 |
| --- | --- |
| [`pyenv`](https://github.com/pyenv/pyenv) + Python 3.10.x | 必须先用 pyenv 安装并设定 3.10 版本，脚本仅支持 >=3.8,<3.12。 |
| [Poetry ≥ 1.8.3](https://python-poetry.org/) | 管理 quickstart Python 环境。 |
| Docker & Docker Compose | quickstart 会启动多个容器，需要本地 Docker 正常运行。 |
| Node.js ≥ 18.17（可选） & Yarn | 仅在开发前端时需要。 |

---

## 一键启动 Supafund 服务

### 1. 准备 Python 环境（pyenv）

```bash
brew install pyenv            # 若已安装可跳过
pyenv install 3.10.13         # 仅首次安装所需版本

cd quickstart
pyenv local 3.10.13           # 让当前目录默认使用 3.10.13
python3 --version             # 确认输出为 Python 3.10.x
```

> 若提示找不到 `pyenv`，请按照官方文档将 `eval "$(pyenv init -)"` 写入 shell 配置后重新打开终端。

### 2. 初始化 Poetry 虚拟环境（首次执行）

```bash
poetry env use "$(pyenv which python)"
poetry install --only main --no-cache
```

以上步骤只需运行一次，后续脚本会复用同一个虚拟环境。

### 3. 启动 Supafund 服务

```bash
./start_supafund.sh
```

脚本会执行以下操作：

1. 生成/更新 `.operate/` 目录及 `configs/config_supafund.json` 配置。
2. 检查所需容器与权限，并自动拉起所有服务。
3. 默认将 Supafund UI 映射到 `http://localhost:8716`。

运行成功后，打开浏览器访问：<http://localhost:8716>

> ⚠️ 请勿在 `poetry shell` 内或使用 `poetry run ./start_supafund.sh` 执行脚本，否则 quickstart 会检测到虚拟环境并直接退出。
>
> 如需停止服务，请在 `quickstart` 目录执行：`./stop_service.sh configs/config_supafund.json`。

### 常用环境变量

运行 `start_supafund.sh` 前可按需设置：

```bash
export SUPAFUND_WEIGHTS='{"founder_team":20,"market_opportunity":20,"technical_analysis":20,"social_sentiment":20,"tokenomics":20}'
export SUPAFUND_API_ENDPOINT="https://api.supafund.xyz"
export MIN_EDGE_THRESHOLD=5
export RISK_TOLERANCE=5
```

脚本会在终端提示缺失的变量并支持交互式输入。

---

## 前端本地开发（可选）

如果需要修改 Supafund UI，可在 `frontend/` 中本地启动 Next.js：

```bash
cd frontend
yarn install
yarn dev
```

开发服务器默认监听 `http://localhost:3000`，与 quickstart 服务的 API (`http://localhost:8000/api`) 兼容。完成修改后，可将静态资源重新打包到 quickstart（参见 `frontend/supafund/README.md` 中的打包说明）。

---

## 目录索引

- `quickstart/`：运行 Supafund 服务的脚本、配置与辅助工具。
  - `configs/config_supafund.json`：代理服务配置入口。
  - `start_supafund.sh` / `stop_service.sh`：启动与停止服务。
  - `analyse_logs.sh`、`check_service_status.sh` 等脚本用于诊断。
- `frontend/`：Supafund Next.js 应用，已移除其它代理依赖，可专注于 Supafund 功能开发。

---

## 常见问题

- **Docker 未运行 / 权限不足**：请先启动 Docker Desktop，并确保当前用户可访问 Docker socket（macOS 默认为 `~/.docker/run/docker.sock`）。
- **端口冲突**：若 `8716` 或 `8000` 端口被占用，请先释放端口再运行脚本。
- **配置输入错误**：可使用 `poetry run ./reset_configs.sh configs/config_supafund.json` 重置交互式配置。

如需进一步的调试说明，可查阅 `quickstart/` 目录下的文档（`SUPAFUND_SETUP.md`、`TROUBLESHOOTING_REPORT.md` 等）。
