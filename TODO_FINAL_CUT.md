Supafund Quickstart 精简与文档对齐最终计划

概览：本计划旨在把当前含 Pearl 定制的 Supafund Quickstart 收敛为“官方 Trader Quickstart + Supafund 参数”的标准形态。核心任务包括：依《TODO_SUPAFUND_FRONTEND_REDUCTION.md》裁剪前端，仅保留 Supafund 所需代码且保持像素级一致；统一脚本与配置（public_id `supafund/trader:0.1.0`，hash `bafybeieb2t5mmrzm6jq5mzt626oxo4n66z7ifylzu3acbrlo4oor5y22se`，端口 8716，STORE_PATH `/data` 等）满足 Pearl 文档《Integrating Your AI Agent with Pearl》《Agent integration checklist》要求；提供镜像构建/推送指引；确保用户仅需运行 `./start_supafund.sh` 即可完成部署并访问 http://localhost:3000 与 http://localhost:8716。以下各阶段须按序执行并通过对应验证。

阶段 0：建立基线
执行 yarn install && yarn lint && yarn test && yarn build；运行一次现有 ./start_supafund.sh，保存日志+关键页面截图，确认当前 Supafund 版本可正常跑通（后续作为回归基准）。
阶段 1：梳理 Supafund 依赖
对 frontend/supafund/** 做 import 扫描，形成依赖清单（组件、上下文、服务、样式）；标注用途和与 Pearl/其他 agent 的耦合情况，给出“保留/迁移/替换/删除”策略，并存档做为裁剪过程中唯一参照。
阶段 2：精简前端（遵循《TODO_SUPAFUND_FRONTEND_REDUCTION.md》）
搭建 supafund/core 与 supafund/ui 目录结构，仅保留 Supafund 所需文件；将 Pearl 复用组件按原样迁入 Supafund，而不是继续引用 Pearl 目录。
调整 TS path/别名，仅暴露 Supafund 所需路径；删除所有 Pearl、Optimus、Modius 等残留目录与 import。
每裁剪一批，执行 yarn lint/test/build 及实际 UI 对比，确保视觉和交互与基线一致。
✔ 阶段 3：Quickstart 脚本与配置调整
脚本/配置标准化
删除 pearl_daemon.py、start_pearl_daemon.sh 等 Pearl 特有脚本与文档。
重写 quickstart/start_supafund.sh 使其仿照官方 trader 流程：环境变量提示 → poetry install → poetry run operate qs start（使用 Supafund config_supafund.json）。
清空 .operate-* 旧缓存，改为运行时自动生成。
服务模板与环境变量
quickstart/configs/config_supafund.json、packages/supafund/services/trader/service.yaml 参考官方 trader，确保：
public_id: supafund/trader:0.1.0，hash: bafybeieb2t5mmrzm6jq5mzt626oxo4n66z7ifylzu3acbrlo4oor5y22se；
number_of_agents: 1、端口映射 8716 (line 8716)；
STORE_PATH=/data、healthcheck、log、私钥等与 Pearl 官方要求一致。
验证 SERVICE_VERSION、service.api 参数与 staking/RPC/env vars 对应 Pearl 指南。
镜像发布说明
使用 poetry run autonomy build-image supafund/trader:0.1.0:<hash> + docker tag + docker push supafund/oar-trader:<hash>；
保留 docs/docker_image_publish.md 作为镜像同步指引，文档需纳入 README 链接。
✔ 阶段 4：文档改造（对比现有 README 与官方要求）
quickstart/README.md
改为 Supafund 专用说明：系统要求 -> 环境变量 -> ./start_supafund.sh 流程 -> UI 访问 (http://localhost:3000 & http://localhost:8716)。
删除与 Trader/Mech/Optimus 等无关段落，保留 staking、资金补充等 Pearl 原生功能说明，并引用官方 Pearl 集成文档（健康检查、STORE_PATH、日志等）。
quickstart/trader-0.27.3/README.md
更新示例命令与配置路径，统一指向 Supafund 包（autonomy fetch --local --service supafund/trader 等）。
保留 mint/keys/Safe 指南但改成 Supafund hash、agent_id、staking 等参数；说明 quickstart 可自动处理资金/部署（避免重复的手动部署指令）。
在 README 中明确引用 Pearl 官方文档要点：
端口 8716、healthcheck JSON、日志格式、STORE_PATH、环境变量类型。
誓一致 README 与官方《Integrating Your AI Agent with Pearl》《Agent integration checklist》要求。
阶段 5：全流程验证
清理 .operate、deployment 后，运行新版 ./start_supafund.sh；确认脚本输出、Docker 镜像使用 supafund/oar-trader:<hash>，若 Docker 提示镜像被替换，指示输入 y 继续或先 docker compose down。
启动前端，确认主页只显示 Supafund agent；点击 “Start agent & stake” 能成功驱动后台 API，无 Pearl 相关提示。
访问 http://localhost:8716 检查 UI、healthcheck 是否正常；验证 agent 在 .operate/services/sc-*/ 下产生 log.txt、健康检查符合 Pearl JSON。
再跑 yarn lint/test/build，确保裁剪后依然通过。
阶段 6：交付沟通
将依赖清单、截图、脚本输出、README 更新等整理成 PR/变更说明，公布镜像标签 supafund/oar-trader:<hash>。
通知 Juli 新流程：只需 ./start_supafund.sh + Quickstart UI；前端已剔除 Pearl 入口，.operate 自动生成；提供更新文档链接（README + docker_image_publish）。
安排 Juli 用全新仓库/分支重新跑流程，确认按 QS 操作即可启动 Supafund agent。
此计划对齐现有 README 和 Pearl 官方文档，确保兼容 Quickstart 体验、满足 Pearl 集成的健康、日志、端口等要求，同时完成 Supafund 专属简化。
