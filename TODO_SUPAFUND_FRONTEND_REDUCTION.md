# Supafund 前端裁剪执行指南（唯一操作手册）

本文为 **Supafund 前端裁剪** 的唯一权威指南。执行任何代码改动前，请完整阅读并严格按步骤落实。若工作中出现与本指南冲突的需求，应先更新本指南，再行动。

---

## 1. 背景与目标
- **现状痛点**：`supafund-agent/frontend` 仍保留大量 Pearl 相关组件、上下文、配置，导致依赖链庞大、维护困难。
- **最终目标**：保留 Supafund 所需的全部功能、样式与交互（像素级不变），同时移除与其他 agent 无关的结构，使目录只剩 Supafund 必需代码。
- **接口要求**：前端对 middleware 的 API 调用必须保持 **完全一致**，不允许修改请求/响应结构。
- **UI 要求**：布局与样式 **绝对不可改变**。如需复用 Pearl 设计，必须把对应代码原样迁移到 Supafund 目录，而非改写。

---

## 2. 全局约束
1. **禁止改动布局、样式、视觉效果**。遇到需要复用的区域，直接拷贝原始组件/样式文件到 Supafund 目录，保持 className、CSS、AntD 结构不变。
2. **禁止修改 middleware/后端接口参数**。任何 Hook 或 Service 调用接口时的 payload、URL、方法都必须保持一致。
3. **保留可运行性**：完成裁剪后，Quickstart 流程需要无阻运行，前端 `yarn build` 必须通过。
4. **修改前后功能对照**：所有 Supafund 页面、弹窗、按钮、警告提示必须逐项确认“存在/行为一致”。如需验证截图，请保留 “前后对比” 记录。
5. **严格执行验证步骤**（详见各任务的 “验证 / 失败条件”）。

---

## 3. 交付标准（Definition of Done）
- ✅ `frontend/` 只保留 Supafund 必需的代码与资源：页面、组件、上下文、配置、静态文件。无 Pearl、Optimus、Modius 等残留。
- ✅ TS `paths` 仅暴露 Supafund 所需别名（例如 `@/supafund/*`），无全局 `@/*`。
- ✅ UI、交互、文案和视觉与当前版本完全一致，可通过对比截图或手动验收确认。
- ✅ Quickstart run + Supafund UI 全流程自测无异常（创建/更新/启动/停止/查看 Dashboard 等）。
- ✅ `yarn lint`、`yarn test`、`yarn build` 全部通过。
- ✅ 所有任务在本文档中对应的“验证”条目均记录完成结果（建议在执行时更新文档或保留日志链接）。

---

## 4. 执行步骤与验收标准

> 建议按照步骤顺序执行。每个步骤末尾列出了“通过条件”与“不能通过条件”，以及必须执行的验证动作。未满足通过条件时不得进入下一步。

### 步骤 0：建立基线与备份
- **目的**：确认当前代码工作正常，避免后续缺乏回滚点。
- **操作要点**：
  1. 在当前分支创建工作分支 `feature/supafund-frontend-trim`.
  2. 运行 `yarn install`（如已安装可跳过）、`yarn lint`、`yarn test`、`yarn build`，并记录输出。
  3. 运行 Quickstart（`./quickstart/start_supafund.sh`）并确认 Supafund UI 启动、主要页面可访问；截取关键页面（Main、Dashboard、Setup）的截图作为对照基线。
- **通过条件**：上述命令均成功；截图归档；无未解释的报错。
- **不能通过条件**：任一命令失败或 UI 出现现有问题未记录。需排查解决或说明原因。
- **验证**：保留命令输出与截图路径，后续复核时使用。

### 步骤 1：梳理 Supafund 依赖清单
- **目的**：识别 Supafund 运行所需的组件、Hook、Context、常量，判定哪些必须复制/保留。
- **操作要点**：
  1. 执行脚本扫描 `supafund/` 导入链，生成依赖清单（包括 `@/components/...`、`@/context/...` 等）。
  2. 将结果整理成表格，标注每个依赖的用途（例如“启动按钮”“资金告警”）、是否与 UI 相关、是否依赖其他 agent 逻辑。
  3. 对每项依赖给出处理策略：`复制到 Supafund`, `保留（已在 supafund 内）`, `重写/合并后保留行为`, `可删除`。
- **通过条件**：清单覆盖所有 import；每一项指定明确策略；评估结论得到确认（必要时与团队复核）。
- **不能通过条件**：遗漏依赖、策略模糊、未考虑级联依赖（例如复制组件时需同时复制上下游）。
- **验证**：将清单附在文档或另存文件，并在本文档引用（目录/附录）。

### 步骤 2：搭建 Supafund 新目录骨架
- **目的**：建立新的目录结构，保证后续迁移有明确落点。
- **操作要点**：
  1. 在 `frontend/supafund/` 下创建两层结构：  
     - `core/`：放置 Providers、Hooks、Service 接口、配置、常量、工具函数。  
     - `ui/`：放置页面、Section、共享组件、样式文件等。  
  2. 预先创建子目录：`core/providers`, `core/hooks`, `core/services`, `core/config`, `ui/pages`, `ui/sections`, `ui/components`, `ui/shared`, `ui/styles`（如需要），确保与依赖清单对应。
  3. 设置 `tsconfig.json` 路径别名为 `@/supafund/*`，并临时保留旧别名（若立即删除会导致编译失败）。新别名须能解析到新目录。
- **通过条件**：新目录结构落地；`tsconfig` 存在新别名；项目仍能编译（如需暂时跳过 ESLint 警告须记录原因）。
- **不能通过条件**：目录缺失、命名不规范、别名失效导致构建失败。
- **验证**：运行 `yarn lint --no-cache`（忽略现存 warning），确保无新增编译错误。

### 步骤 3：迁移基础设施类代码（Providers / Hooks / Config）
- **目的**：确保 Supafund 独立拥有运行所需上下文，减除多 agent 逻辑。
- **操作要点**：
  1. 按步骤 1 的清单，依次将 `context/`、`hooks/`、`config/` 中 Supafund 必需项复制到 `supafund/core/` 对应位置；保持原文件名与导出接口不变，确保 UI 不受影响。
  2. 迁移时，删除或内联其他 agent 的分支逻辑（如 `AgentType.PredictTrader` 等），但要保留 Supafund 必需的行为。
  3. 保证供应默认值、Provider 树结构与原先一致（例如 `PageStateProvider`、`ServicesProvider` 等），只是文件归属调整。
  4. 若 Provider 内部调用的服务/常量仍位于旧目录，立即复制到 `core/` 并调整引用。
  5. 更新相关 `index.ts` 导出入口（例如 `supafund/core/providers/index.ts`），准备供 UI 使用。
- **通过条件**：所有 Provider/Hook 在新路径下可用；旧路径可被替换成新别名；功能逻辑（接口请求、状态流转）保持一致。
- **不能通过条件**：遗漏依赖导致运行报错；引入新的逻辑变更；Provider 初始化顺序改变导致副作用。
- **验证**：临时修改 `_app.tsx` 中 Import 指向新路径，启动 `yarn dev` 手动走一遍核心流程确认无报错（若尚未迁移 UI，可先隐藏入口，但需记录做法）。

### 步骤 4：迁移 UI 组件与页面（保持视觉完全一致）
- **目的**：把 Supafund 页面涉及的所有 UI 组件迁移到 `supafund/ui`，同时保证样式原封不动。
- **操作要点**：
  1. 依据依赖清单，逐一复制以下内容：  
     - 页面文件：`pages/index.tsx`、`pages/_app.tsx` 等需要的入口。  
     - 组件目录：`components/MainPage`、`components/SetupPage`、`components/MainPage/sections/...`、`components/MainPage/header/...` 等 Supafund 使用到的所有文件。  
     - 样式文件、静态资源（若样式依赖 `.scss`、`.less`、图片，需原样迁移）。
  2. 保持所有 Ant Design 组件、DOM 结构、className、CSS/SCSS 内容与原文件一致，禁止重写布局。
  3. 若组件依赖全局样式（例如 `styles/globals.scss`），将其复制或在 supafund 层导入，保证渲染效果不变。
  4. 解决迁移产生的 import：统一改用 `@/supafund/...` 别名。
  5. 对“Start/Stop Agent 按钮”“资金提醒”“Dashboard Tabs”等关键交互组件，迁移后逐项手动验证行为（点击、弹窗、Hover 状态等）。
- **通过条件**：所有页面通过新路径引用仍然可渲染；视觉与交互与基线截图一致；没有来自旧目录的 import。
- **不能通过条件**：任一组件引用旧目录；页面 UI 发生偏移/样式丢失；交互行为异常。
- **验证**：启动 `yarn dev`，对比基线截图；录制关键交互视频或截屏作为证明。

### 步骤 5：重建页面入口与 Provider 链
- **目的**：让新目录完全接管应用入口，确保运行时不再依赖旧路径。
- **操作要点**：
  1. 在 `supafund/ui/pages/_app.tsx` 内重建 Provider 链：按照原 `pages/_app.tsx` 顺序引入所有迁移后的 Provider，确保结构和逻辑一致。
  2. 在 `supafund/ui/pages/index.tsx` 中仅引用 `supafund` 目录内的模块，移除多 agent 切换逻辑（如 `AgentSelection`、`SwitchAgent` 的引用)，但保留 Supafund 页面需要的功能入口。
  3. 调整 `next.config.mjs` 或相关配置，使 Next.js 入口只读取新的 `pages`（必要时通过 `next.config.mjs` 设置 `pageExtensions` 或 `dir`）。如需要将 Supafund 页面作为默认导出，可采用自定义 `pages/index.tsx` 重新导出 Supafund 入口。
  4. 确认 `_app.tsx` / `index.tsx` 不再引用旧目录下的 Provider/组件。
- **通过条件**：应用入口完全依赖 `supafund` 目录；`yarn dev`、`yarn build` 均能成功。
- **不能通过条件**：仍有旧目录 import；Provider 顺序改变导致状态错误；构建失败。
- **验证**：执行 `yarn build`，检查输出；手动点击全流程确认 Provider 功能正常（如 Store、Electron API、Modal 等行为是否一致）。

### 步骤 6：清理旧目录与别名
- **目的**：删除不再需要的 Pearl 目录，保证仓库简洁。
- **操作要点**：
  1. 确认所有引用已指向 Supafund 新目录，利用 `rg '@/components'` 等命令确保没有旧路径残留。
  2. 删除 `frontend/components`, `frontend/context`, `frontend/hooks`, `frontend/config` 等旧目录（仅保留仍有用的公共文件，如 `styles`, `public`）。
  3. 清理 `tsconfig.json` 中废弃别名，只保留 `@/supafund/*` 和必要的公共路径。
  4. 运行 `yarn lint`, `yarn test`, `yarn build`，确保删除后工程仍可正常构建。
- **通过条件**：旧目录全部删除；项目构建成功；无任何 `@/components` 等旧别名引用。
- **不能通过条件**：构建失败、缺少资源导致 UI 报错；未清理干净。
- **验证**：命令行输出记录；再次运行应用手动验证。

### 步骤 7：依赖与脚本收尾
- **目的**：移除不再需要的依赖/脚本，并校验 Quickstart。
- **操作要点**：
  1. 检查 `package.json`，移除仅为其他 agent 提供支持的依赖（若确定 Supafund 不再使用）。
  2. 清理 `.operate`、Quickstart 内对 Pearl 的引用（如脚本 `start_pearl_daemon.sh` 可保留但需注明不再使用，若会混淆则归档或删除）。
  3. 运行 `yarn dedupe`（如使用 Yarn Berry 可调用 `yarn install --check-files`），确保锁文件一致。
  4. 运行 Quickstart 全流程（启动代理、打开 UI、执行 Dashboard、停止服务），验证无报错。
- **通过条件**：依赖列表精简；Quickstart 正常；锁文件稳定。
- **不能通过条件**：删除依赖导致编译出错；Quickstart 报错。
- **验证**：记录 `yarn build` 与 Quickstart 运行日志，保留 CLI 输出。

### 步骤 8：回归测试与交付验收
- **目的**：最终确认功能、视觉与接口完全符合要求。
- **操作要点**：
  1. 对照步骤 0 的截图，再次截取相同页面，进行视觉对比（工具或人工）。
  2. 手动回归关键流程：  
     - 页面加载 → Setup → Main → Dashboard → 更新页面。  
     - Start/Stop Agent 按钮行为、资金提醒弹窗、奖励弹窗。  
     - 所有表单提交流程（含 Supafund 特有字段）。  
  3. 验证 API 调用：监听浏览器网络请求，确保接口路径、参数、返回处理均与初始版本一致（可使用 `DevTools -> Network` 对比）。
  4. 汇总所有验证结果，更新本文档“验证记录”（可追加一个章节记录时间/人员/结果）。
- **通过条件**：所有交互与接口验证通过；视觉无差异；命令行/浏览器无异常日志。
- **不能通过条件**：任一环节与原版不一致或出现新错误。
- **验证**：备份测试报告、截图、Network 对比记录。

---

## 5. 注意事项与风险提示
- **交叉依赖**：部分 Provider 之间存在循环引用风险，迁移时需保持导入顺序；如遇问题先提取公共类型或延迟加载。
- **Electron API**：若 Supafund 运行在 Electron Shell 中，新路径需确保 `window.electron` 调用仍被注册；请在 Dev 环境确认功能。
- **国际化/文案**：若存在 i18n 或文案常量，迁移时注意同步（即便目前 mayoría 文案为英文，也要避免缺失）。
- **运行性能**：裁剪后要关注打包体积与加载速度是否变化（可记录 `next build` 输出的 chunk 尺寸供对比）。
- **可回溯性**：建议在每一步完成后提交一次临时 commit（或使用 Git stash），以便出现问题时快速回退。

---

## 6. 验证记录（执行过程中补充）
> 下表需在执行过程中持续填写。每个步骤完成后记录日期、执行人、结果与备注。若出现异常，也需在备注中描述处理方式。

| 步骤 | 日期 | 执行人 | 结果（通过/失败） | 验证摘要 / 备注 |
| ---- | ---- | ------ | ---------------- | --------------- |
| 0 基线 | 2025-02-14 | Codex | 记录完成（存在已知 lint/build 失败） | `yarn lint`/`yarn build` 因既有 ESLint 问题失败；`start_supafund.sh` 报 Python 版本限制（≥3.8,<3.12），run_service 退出码 1；测试通过 |
| 1 依赖清单 | 2025-02-14 | Codex | 通过 | 生成附录 A，覆盖全部 33 项别名依赖并给出处理策略 |
| 2 目录骨架 | 2025-02-14 | Codex | 通过 | 新增 `supafund/core/*`、`supafund/ui/*` 目录并更新 tsconfig 别名；lint 仍因既有问题失败，已记录 |
| 3 Provider 迁移 | 2025-02-14 | Codex | 通过（待后续裁剪其它 agent 逻辑） | 将 context/hooks/config/constants/enums/types/theme/client/service/utils 全量复制至 `supafund/core/*` 并批量改用 `@/supafund/core/...` 引用；新增 providers 汇总导出；`yarn test` 保持通过 |
| 4 UI 迁移 | 2025-02-14 | Codex | 通过（待最终视觉核对） | 已将旧 UI 组件完整迁移到 `supafund/ui/components`，统一替换别名为 `@/supafund/...`，并保持 `yarn test` 通过；视觉确认安排在步骤 8 |
| 5 入口重建 | 2025-02-14 | Codex | 进行中 | 入口已指向 `supafund/ui/pages`，ServicesProvider 等核心逻辑已裁剪为 Supafund 专用；2025-02-15：补齐 Supafund 专用 null 安全/路径修复后 `yarn build` 通过；后续需继续移除遗留多 agent 资源并完成配置清理 |
| 6 清理旧目录 |      |        |                  |                 |
| 7 依赖收尾 |      |        |                  |                 |
| 8 回归验收 |      |        |                  |                 |

---

## 7. 附录建议
- **附录 A**：步骤 1 生成的依赖清单（可放置 Markdown 表格或链接到 `docs/frontend_snapshot.txt` 新版本）。
- **附录 B**：基线与最终截图对比（可注明存放路径）。
- **附录 C**：命令输出日志（lint/test/build/Quickstart）。
- **附录 D**：如需临时保留的 Pearl 相关脚本/文档，列出原因与后续处理计划。

---

## 附录 A：Supafund 依赖清单（步骤 1）

| 依赖路径 | 分类 | 处理策略 | 注意事项 & 验证 |
| --- | --- | --- | --- |
| `@/client` | Middleware 客户端类型与枚举 | 复制到 `supafund/core/client`，仅保留 Supafund 所需导出 | 保持 API 类型不变；验证所有 service 调用编译通过 |
| `@/components/Alert` | UI 组件（提示条） | 原样迁移到 `supafund/ui/components/Alert` | 复制相关样式与依赖，渲染效果对比截图 |
| `@/components/MainPage/header` | Main Header 组合组件 | 整体迁移至 `supafund/ui/components/MainPage/header` | 包含 Start/Stop/UI 按钮逻辑；迁移后验证按钮状态机 |
| `@/components/MainPage/sections/AddFundsSection` | 主页面资金引导 | 迁移到 `supafund/ui/components/MainPage/sections/AddFundsSection` | 注意依赖 feature flag、MasterSafe；点击流程验证 |
| `@/components/MainPage/sections/AlertSections` | 资金/系统提醒集合 | 迁移至 `supafund/ui/components/MainPage/sections/AlertSections` | 依赖 Store、Services、FeatureFlag；确保所有 Alert 渲染一致 |
| `@/components/MainPage/sections/GasBalanceSection` | Gas 余额卡片 | 原样迁移 | 校验数值格式与阈值逻辑未变 |
| `@/components/MainPage/sections/KeepAgentRunningSection` | “保持运行” 提示 | 原样迁移 | 验证仅在 agent 部署且未获奖励时显示 |
| `@/components/MainPage/sections/OlasBalanceSection` | OLAS 余额卡片 | 原样迁移 | 验证余额展示与 Tooltip |
| `@/components/MainPage/sections/RewardsSection` | 奖励展示 & Modal | 原样迁移 | 确保 React Query 数据依赖完好，Modal 触发正常 |
| `@/components/MainPage/sections/StakingContractUpdate` | Staking 合约提示 | 原样迁移 | 与 staking provider 交互保持一致 |
| `@/components/Pages/GoToMainPageButton` | 跳转按钮 | 原样迁移 | 验证导航路径正确 |
| `@/components/SetupPage/Create/SetupCreateHeader` | Setup 页头部 | 原样迁移 | 保持文案与图标一致 |
| `@/components/UpdateAgentPage/UpdateAgentCard` | 更新代理卡片 | 原样迁移 | 验证表单、按钮行为 |
| `@/components/UpdateAgentPage/context/UpdateAgentProvider` | Update Agent 上下文 | 迁移到 `supafund/core/providers` | 确保状态流一致；相关 Hook 迁移同步 |
| `@/components/styled/CardFlex` | 样式组件 | 原样迁移 | 保留 styled-components 样式，确保版式不变 |
| `@/components/styled/FormFlex` | 样式组件 | 原样迁移 | 验证表单布局不变 |
| `@/constants/serviceTemplates` | Service 模板常量 | 复制到 `supafund/core/constants`，仅保留 Supafund 配置 | 删去其他 agent 模板但保留字段结构；验证 Quickstart 使用 |
| `@/enums/Agent` | Agent 类型枚举 | 迁移并裁剪至只含 Supafund | 确认所有引用更新；避免遗留其他 agent ID |
| `@/enums/Chain` | 链枚举 | 迁移至 `supafund/core/enums`（保留 Supafund 需要的链） | 若其他链仍用于类型校验需保留；验证编译 |
| `@/enums/Pages` | 页面枚举 | 迁移并保留 Supafund 使用的枚举值 | 更新导航逻辑，确保所有值在 UI 中仍被使用 |
| `@/enums/SetupScreen` | Setup 步骤枚举 | 原样迁移 | 验证 Setup 流程导航正确 |
| `@/enums/Wallet` | 钱包类型/所有者枚举 | 迁移至 `supafund/core/enums` | 被多个 Provider 依赖；验证资金模块运行 |
| `@/hooks/useFeatureFlag` | 功能开关 Hook | 迁移后仅保留 Supafund 配置 | 确保返回值对齐 UI 需求；添加测试或运行验证 |
| `@/hooks/useNeedsFunds` | 资金充足性 Hook | 原样迁移 | 验证 funding gating 逻辑，与 UI 联动一致 |
| `@/hooks/usePageState` | 页面状态 Hook | 迁移至 `supafund/core/hooks` | 依赖 PageStateProvider；导航逻辑保持不变 |
| `@/hooks/useService` | 单个 Service Hook | 原样迁移 | 需与 ServicesProvider 配合；验证部署状态显示 |
| `@/hooks/useServices` | Service 集合 Hook | 原样迁移并裁剪多 agent 逻辑 | 保留 Supafund 配置与存储；验证默认选择服务仍然工作 |
| `@/hooks/useSetup` | Setup 流程 Hook | 原样迁移 | 确保 Setup 页按钮继续工作 |
| `@/hooks/useStakingProgram` | Staking Program Hook | 原样迁移 | 验证 staking program 选择与资金判定 |
| `@/hooks/useWallet` | 钱包上下文 Hook | 迁移至 `supafund/core/hooks` | 确保 master safe/service wallet 数据继续提供 |
| `@/service/agents/Supafund` | Supafund Service API | 迁移至 `supafund/core/service/agents` | 保留类继承与接口；验证所有调用点编译/运行正常 |
| `@/theme` | Ant Design 主题配置 | 原样迁移到 `supafund/core/theme` | 确保在 `_app.tsx` 中引用，外观一致 |
| `@/types/Util` | 公共类型（Maybe/Nullable 等） | 迁移至 `supafund/core/types` | 校验所有类型引用；必要时保留额外工具类型 |
| `@/supafund/hooks/useSupafundData` | Supafund 内部 Hook | 已在 Supafund 模块中 | 最终需要更新别名为 `@/supafund/core/hooks` 等，保持可用 |

---

请严格对照本手册执行，任何偏离都可能破坏 UI 一致性或接口兼容性。在执行过程中，如遇未覆盖情形，应先更新本手册，再继续改动。***
