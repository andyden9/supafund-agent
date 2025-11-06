# Supafund Frontend Trim Log

此文件记录执行《TODO_SUPAFUND_FRONTEND_REDUCTION.md》阶段 0/1/2 的具体操作、验证结果与后续计划。

## 阶段 0：基线与备份

- [x] `yarn lint`
- [x] `yarn test --watch=false`
- [x] `yarn build`
  - 以上命令均在 `frontend/` 目录下成功执行，无错误（详见终端日志）。
- [ ] Quickstart + UI 截图归档（待与后续裁剪一并补充，可在阶段 5 时统一收集）。
- 备注：`yarn` 命令执行时因用户 cache 不可写，自动使用临时缓存目录；不影响结果。

## 阶段 1：Supafund 依赖清单

已使用脚本扫描 `frontend/supafund` 下的 `@/` 导入，得到按顶级模块分组的依赖列表。后续将依据此清单决定迁移或裁剪策略。

### 顶级模块分布概览

- `@/abis/*`：8 个条目，主要用于 `core/config` 与 Multicall。
- `@/graphql/queries`：1 个条目，Rewards 相关查询。
- `@/supafund/*`：大量内部别名引用，需统一改为新结构下的路径。
- `@/components`, `@/context`, `@/hooks`, `@/service`, `@/theme`, `@/types`, `@/utils` 等 Pearl 公共目录仍被引用，需要逐一迁移或替换。

> 详细清单见下方附录《Attachment A - Import Map》。该附录由脚本自动生成，确保覆盖所有 import。

## 阶段 2：目录骨架准备

当前 `frontend/supafund` 内已存在以下目录：

```
supafund/
  core/
  ui/
  hooks/
  components/
  utils/
  ...
```

为配合裁剪计划，将：

1. 在未来提交中把遗留的 `supafund/components/*`、`supafund/hooks/*`、`supafund/utils/*` 中的代码迁移/合并到 `core/` 与 `ui/` 子目录，并删除旧结构。
2. 按手册要求在 `core` 下细分 `providers`、`services`、`config`、`hooks` 等（已存在，后续仅保留所需内容）。
3. 更新 TS path 映射（阶段 3 以后执行）。

目前仅记录结构状态，尚未移动文件，避免大范围变更后缺乏依赖背景。

## 阶段 3：Supafund 专用 UI 整理（进行中）

- [x] 精简 `supafund/ui/components/MainPage/header/index.tsx`：移除 Electron 托盘状态同步与多代理 `SwitchAgentButton`，新增 Supafund 专属标题与设置入口。
- [x] 删除 `SwitchAgentButton.tsx`（Supafund 版本），并重新生成依赖映射 `supafund/scripts/import_map.md`。
- [x] 验证 `yarn lint`、`yarn build`（均在 2025-11-05 本地通过，详见本次终端日志）。
- [x] 更新 `next.config.mjs`，启用 `output: 'export'` 与 `images.unoptimized`，以便 Next.js 直接产出纯静态资源适配 Quickstart 容器。
- [x] 新增一键导出脚本 `yarn supafund:export`：自动执行生产构建并将静态资源同步到 `quickstart/supafund-trader/.../predict-ui-build`，便于容器 8716 端口直接加载最新 Supafund UI。
- [x] 移除多代理入口（`Pages.SwitchAgent`、SwitchAgentSection、主面板切换按钮等），调整 Dashboard 与 Setup 流程只面向 Supafund。
- [x] 调整 `PageStateProvider` 默认页为 `Pages.Main`，首页加载即进入 Supafund 主界面，避免旧 Pearl Setup 页导致 “unable to determine the account setup status”。
- [x] 抽取 `quickstart/scripts/sync_supafund_ui.sh`，可单独同步静态资源到 `.operate` 与运行容器；`start_supafund.sh` 现复用该脚本，方便随时刷新 UI。
- [ ] 后续将继续裁剪 Switch Agent 相关 Section、页面枚举以及遗留的 Pearl 组件引用。

## 附录

### Attachment A - Import Map（节选）

（若需完整列表，可执行 `python supafund/scripts/list_dependencies.py`，输出位于 `supafund/scripts/import_map.md`。）

```
## abis
- abis/agentMech: supafund/core/config/mechs.ts
- abis/erc20: supafund/core/providers/BalanceProvider/utils.ts, supafund/core/services/Multicall.ts
- abis/gnosisSafe: supafund/core/hooks/useMultisig.ts
- abis/mechMarketplace: supafund/core/config/mechs.ts
- abis/requesterActivityChecker: supafund/core/config/activityCheckers.ts
- abis/serviceRegistryL2: supafund/core/config/olasContracts.ts
- abis/serviceRegistryTokenUtility: supafund/core/config/olasContracts.ts
- abis/stakingTokenProxy: supafund/core/config/stakingPrograms/gnosis.ts

## graphql
- graphql/queries: supafund/ui/components/MainPage/sections/RewardsSection/StakingRewardsThisEpoch.tsx

## supafund
- supafund: supafund/ui/components/MainPage/index.tsx, supafund/ui/pages/index.tsx
- supafund/components/sections/SetupForm/SupafundAgentForm: supafund/ui/components/SetupPage/SetupYourAgent/SetupYourAgent.tsx
- supafund/components/sections/UpdateSetup: supafund/ui/components/UpdateAgentPage/index.tsx
- supafund/core/client: supafund/components/sections/Configuration/index.tsx, supafund/components/sections/Dashboard/index.tsx, supafund/components/sections/SetupForm/SupafundAgentForm.tsx, supafund/core/config/agents.ts, supafund/core/config/chains.ts, supafund/core/constants/serviceTemplates.ts, supafund/core/constants/urls.ts, supafund/core/hooks/useService.ts, supafund/core/providers/BalanceProvider/utils.ts, supafund/core/providers/BalancesAndRefillRequirementsProvider.tsx, supafund/core/providers/MasterWalletProvider.tsx, supafund/core/providers/ServicesProvider.tsx, supafund/core/providers/SystemNotificationTriggers.tsx, supafund/core/services/Services.ts, supafund/core/services/Wallet.ts, supafund/core/services/balances.ts, supafund/core/types/Agent.ts, supafund/core/types/Bridge.ts, supafund/core/types/Service.ts, supafund/core/utils/middlewareHelpers.ts, supafund/core/utils/service.ts, supafund/core/utils/x.ts, supafund/ui/components/AddFundsThroughBridge/AddFundsThroughBridge.tsx, supafund/ui/components/AddFundsThroughBridge/useAddFundsGetBridgeRequirementsParams.ts, supafund/ui/components/AddFundsThroughBridge/useAddFundsInputs.tsx, supafund/ui/components/AgentProfile.tsx, supafund/ui/components/Bridge/BridgeOnEvm/DepositForBridging.tsx, supafund/ui/components/Bridge/BridgeTransferFlow.tsx, supafund/ui/components/MainPage/header/AgentButton/AgentButton.tsx, supafund/ui/components/MainPage/header/AgentButton/AgentNotRunningButton.tsx, supafund/ui/components/MainPage/header/AgentButton/AgentRunningButton.tsx, supafund/ui/components/MainPage/header/AgentHead.tsx, supafund/ui/components/MainPage/header/index.tsx, supafund/ui/components/MainPage/sections/KeepAgentRunningSection.tsx, supafund/ui/components/ManageStakingPage/StakingContractSection/MigrateButton.tsx, supafund/ui/components/ManageStakingPage/StakingContractSection/useMigrate.tsx, supafund/ui/components/SetupPage/Create/SetupCreateSafe.tsx, supafund/ui/components/SetupPage/Create/hooks/useGetBridgeRequirementsParams.ts, supafund/ui/components/SetupPage/SetupYourAgent/ModiusAgentForm/ModiusAgentForm.tsx, supafund/ui/components/SetupPage/SetupYourAgent/OptimusAgentForm/OptimusAgentForm.tsx, supafund/ui/components/SetupPage/SetupYourAgent/PredictAgentSetup.tsx, supafund/ui/components/UpdateAgentPage/context/UpdateAgentProvider.tsx
```

> 完整导入映射超过 200 行，若需查看全部，请运行脚本 `python scripts/list_supafund_imports.py`（后续将纳入工具目录）。

---

后续阶段将基于此日志持续更新执行进度与验证结果。
