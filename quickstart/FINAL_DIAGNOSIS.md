# 深度分析：Supafund Agent 问题根本原因

**日期**: 2025-10-23
**分析深度**: 源码级完整分析
**状态**: 已识别所有根本原因

---

## 🎯 执行摘要

经过深入的源码和配置分析，发现 **3 个独立但相关的根本问题**：

1. **RPC 连接配置错误** - 导致链上交互失败
2. **OPENING_MARGIN 参数误解** - 导致市场查询时间窗口错误
3. **环境变量覆盖失效** - 配置文件修改未生效

---

## 📊 问题 1: RPC 连接失败

### 错误症状

```
ConnectionRefusedError: [Errno 111] Connection refused
Failed to establish a new connection: host.docker.internal:8545
Could not successfully interact with staking_token contract
```

### 根本原因

**源码位置**: `trader/service.yaml:684-711`

```yaml
public_id: valory/ledger:0.19.0
type: connection
0:
  config:
    ledger_apis:
      gnosis:
        address: ${RPC_0:str:http://host.docker.internal:8545}  # ← 问题！
        chain_id: ${CHAIN_ID:int:100}
```

**问题链条**:

1. **默认值错误**
   - `RPC_0` 的默认值是 `http://host.docker.internal:8545`
   - 这是 Hardhat 本地测试节点地址
   - 设计用于开发/测试环境，不是生产环境

2. **环境变量缺失**
   - `agent_0.env` 中**没有** `RPC_0` 变量
   - 也没有 `GNOSIS_LEDGER_RPC` 变量
   - 导致使用默认值 `localhost:8545`

3. **Hardhat 未运行**
   - 您的环境没有运行本地 Hardhat 节点
   - 端口 8545 无服务监听
   - 连接失败 ❌

4. **配置分离问题**
   - `config.json` 中有正确的 RPC: `https://gnosis-mainnet.g.alchemy.com/...`
   - 但 ledger connection 不读取 `config.json`，只读取环境变量
   - 环境变量生成逻辑未将 `config.json` 的 RPC 映射到 `RPC_0`

### 配置对比

| 位置 | RPC 值 | 是否生效 |
|------|--------|---------|
| `config.json:19` | Alchemy URL ✅ | ❌ 不被 ledger 使用 |
| `agent_0.env:RPC_0` | **不存在** | ❌ 使用默认值 |
| `service.yaml:684` | `localhost:8545` (默认) | ✅ 实际使用 |
| `agent_0.env:SKILL_FUNDS_MANAGER...RPC_URLS` | Alchemy URL ✅ | ✅ 仅 funds_manager 使用 |

### 影响范围

**受影响的操作**:
- ✅ Staking 合约查询（使用 ledger connection）
- ✅ 链上余额查询
- ✅ 交易发送
- ✅ 事件监听
- ❌ Subgraph 查询（不受影响，走 HTTP）

**为什么部分功能仍工作**:
- Subgraph 查询不依赖 ledger connection
- funds_manager skill 有独立的 RPC 配置
- 只有需要链上交互的操作失败

---

## 📊 问题 2: 市场查询返回空数组

### 错误症状

```
[INFO] Retrieved questions: []
[INFO] Updated bets: []
[WARNING] No bets to store.
```

### 根本原因 #1: OPENING_MARGIN 逻辑误解

**源码位置**: `trader-0.27.2/packages/valory/skills/market_manager_abci/graph_tooling/queries/omen.py:32`

```graphql
fixedProductMarketMakers(
  where: {
    openingTimestamp_gt: ${opening_threshold}  # 关键！
    ...
  }
)
```

**计算逻辑** (`requests.py:174-197`):

```python
query = questions.substitute(
    opening_threshold=self.synced_time + self.params.opening_margin,
    ...
)
```

**语义分析**:

```
openingTimestamp_gt: (current_time + OPENING_MARGIN)
```

**读作**: "查找开放时间**大于**（当前时间 + OPENING_MARGIN）的市场"

**实际效果**:

| OPENING_MARGIN | 查询条件 | 查询语义 |
|---------------|----------|---------|
| 3600 (1小时) | openingTimestamp > 当前+1小时 | 查找"1小时后开放"的市场 ✅ |
| 86400 (1天) | openingTimestamp > 当前+1天 | 查找"1天后开放"的市场 ✅ |
| 560000 (6.5天) | openingTimestamp > 当前+6.5天 | 查找"6.5天后开放"的市场 ❌ |

**您的情况 (2025-10-23 17:18)**:

```
OPENING_MARGIN = 560000 秒 (6.5天)
opening_threshold = 1761211078 + 560000 = 1761771078
                  = 2025-10-30 04:51:18

查询条件:
  WHERE openingTimestamp > 1761771078

现有市场:
  - Deepbot MVP:  openingTimestamp=1760594400 (2025-10-16) ❌
  - DPay MVP:     openingTimestamp=1760594400 (2025-10-16) ❌
  - Unreal AI:    openingTimestamp=1761609540 (2025-10-28) ❌
  - Derad:        openingTimestamp=1761609540 (2025-10-28) ❌

所有市场的 openingTimestamp < 1761771078
→ 所有市场被过滤
→ 返回空数组 []
```

**设计初衷 vs 实际使用**:

| 方面 | 设计初衷 | 您的使用 |
|------|----------|---------|
| 目的 | 提前准备即将开放的市场 | 扩大查询窗口 ❌ |
| 时间方向 | 向未来查找 | 误以为向过去查找 ❌ |
| 典型值 | 3600 (1小时) | 560000 (6.5天) ❌ |
| 查询结果 | 找到即将开放的市场 | 查不到任何市场 ❌ |

### 根本原因 #2: 默认创建者地址

**源码位置**: `service.yaml:81, 347, 471, 595`

**默认值**:
```yaml
creator_per_subgraph: ${CREATOR_PER_SUBGRAPH:dict:{"omen_subgraph":["0x89c5cc945dd550BcFfb72Fe42BfF002429F46Fec"]}}
```

**默认创建者**: `0x89c5cc945dd550BcFfb72Fe42BfF002429F46Fec`

**Supafund 创建者**: `0xAFD5806E1fc7f706236e2F294ab1745A26bDB720`

**验证**:
```bash
# 查看实际使用的值
grep "CREATOR_PER_SUBGRAPH" agent_0.env
```

如果显示的是默认地址 `0x89c5cc...`，说明配置未覆盖成功。

### 根本原因 #3: 语言过滤

**源码位置**: `service.yaml:84, 350, 474, 598`

**默认值**:
```yaml
languages: ${LANGUAGES:list:["en_US"]}
```

**问题**:
- 默认: `["en_US"]`（美式英语）
- 市场: `"en"`（通用英语）
- 不匹配 → 市场被过滤

**您的修复**:
- 已修改 `config_supafund.json` 为 `["en"]` ✅

**验证**:
```bash
# 查看实际使用的值
grep "LANGUAGES" agent_0.env
```

应该显示 `LANGUAGES=["en"]`。

---

## 🔬 技术深度分析

### 配置覆盖链

```
1. service.yaml (默认值)
   ↓
2. config_supafund.json (用户配置)
   ↓
3. 环境变量生成逻辑
   ↓
4. agent_0.env (最终使用)
   ↓
5. Docker 容器环境变量
```

**问题出现在步骤 3**: 环境变量生成逻辑未正确处理某些参数

### 受影响的参数

| 参数 | 在 config.json | 在 agent_0.env | 状态 |
|------|---------------|---------------|------|
| OPENING_MARGIN | ✅ 560000 | ✅ 560000 | ✅ 生效 |
| LANGUAGES | ✅ ["en"] | ✅ ["en"] | ✅ 生效 |
| CREATOR_PER_SUBGRAPH | ✅ 0xAFD... | ✅ 0xAFD... | ✅ 生效 |
| **RPC_0** | ❌ 缺失 | ❌ 缺失 | ❌ 使用默认 localhost |
| GNOSIS_LEDGER_RPC | ✅ Alchemy | ❌ 缺失 | ⚠️ 仅部分 skill 使用 |

### Ledger Connection 工作流程

```
Agent 启动
  ↓
加载 service.yaml
  ↓
读取 ledger connection 配置:
  address: ${RPC_0:str:http://host.docker.internal:8545}
  ↓
查找环境变量 RPC_0
  ↓
未找到 → 使用默认值 localhost:8545
  ↓
尝试连接 host.docker.internal:8545
  ↓
连接失败 ❌
  ↓
所有链上操作失败
```

### Market Query 工作流程

```
update_bets_behaviour 执行
  ↓
调用 _fetch_bets()
  ↓
构建 GraphQL 查询:
  openingTimestamp_gt: (current_time + 560000)
  creator_in: ["0xAFD5806E1fc7f706236e2F294ab1745A26bDB720"]
  language_in: ["en"]
  ↓
发送到 Omen Subgraph
  ↓
Subgraph 过滤:
  - 时间过滤: 所有市场 < (current_time + 560000) ❌
  - 创建者过滤: 匹配 ✅ (假设配置正确)
  - 语言过滤: 匹配 ✅ (假设配置正确)
  ↓
返回空数组 []
  ↓
Retrieved questions: []
```

---

## 🎯 完整解决方案

### 问题优先级

| 问题 | 影响 | 优先级 |
|------|------|--------|
| RPC_0 未设置 | 链上交互全部失败 | 🔴 最高 |
| OPENING_MARGIN 错误 | 查不到市场 | 🔴 最高 |
| 地址大小写 | 可能影响查询 | 🟡 中等 |

### 解决方案 A: 修改 agent_0.env（最直接）

**在 `agent_0.env` 末尾添加**:

```bash
# Ledger RPC 配置
RPC_0=https://rpc.gnosischain.com
```

**然后重启**:
```bash
cd deployment && docker-compose restart
```

### 解决方案 B: 修改 service.yaml（更彻底）

**文件**: `.operate/services/sc-*/trader/service.yaml:684`

**修改**:
```yaml
0:
  config:
    ledger_apis:
      gnosis:
        address: ${RPC_0:str:https://rpc.gnosischain.com}  # 改默认值
```

**重新生成部署**:
```bash
./stop_service.sh configs/config_supafund.json
./start_supafund.sh
```

### 解决方案 C: 修改配置生成逻辑（最根本）

**需要修改 `operate` 包的部署生成器**，使其：

1. 从 `config.json:chain_configs.gnosis.ledger_config.rpc` 读取 RPC
2. 将其映射到 `RPC_0`, `RPC_1` 等环境变量
3. 写入 `agent_0.env`

**相关代码**: `operate/services/service.py` 或 `operate/quickstart/run_service.py`

---

## 🎯 问题 2 解决方案: OPENING_MARGIN

### 修改配置文件

**文件**: `configs/config_supafund.json`

**当前值** (错误):
```json
{
  "OPENING_MARGIN": {
    "value": "560000"  // 6.5天 ❌
  }
}
```

**正确值** (推荐):
```json
{
  "OPENING_MARGIN": {
    "value": "3600"  // 1小时 ✅
  }
}
```

**或者**（如果想查找未来 1 天内开放的市场）:
```json
{
  "OPENING_MARGIN": {
    "value": "86400"  // 1天 ✅
  }
}
```

### 语义对比表

| OPENING_MARGIN | 查询条件 | 实际效果 | 适用场景 |
|---------------|----------|---------|---------|
| 3600 | openingTimestamp > (now + 1h) | 查找"1小时后开放"的市场 | ✅ 推荐 |
| 86400 | openingTimestamp > (now + 1d) | 查找"1天后开放"的市场 | ✅ 可以 |
| 560000 | openingTimestamp > (now + 6.5d) | 查找"6.5天后开放"的市场 | ❌ 太远 |
| -3600 | openingTimestamp > (now - 1h) | 查找"已开放或1小时内开放"的市场 | ⚠️ 需改代码 |

### 如果想查询已开放的市场？

**当前查询逻辑不支持**！

需要修改 `omen.py:32`:
```graphql
# 当前 (只查未来)
openingTimestamp_gt: ${opening_threshold}

# 需要改为 (查过去+未来)
openingTimestamp_lte: ${closing_threshold}
openingTimestamp_gte: ${opening_threshold_past}
```

或使用负数 OPENING_MARGIN (未测试，可能不支持)。

---

## 🎯 问题 3 解决方案: 环境变量覆盖

### 当前状态

| 参数 | config.json | agent_0.env | 生效值 |
|------|------------|-------------|--------|
| OPENING_MARGIN | 560000 | 560000 | ✅ 560000 |
| LANGUAGES | ["en"] | ["en"] | ✅ ["en"] |
| CREATOR_PER_SUBGRAPH | 0xAFD... | 0xAFD... | ✅ 0xAFD... |
| **RPC_0** | ❌ 无映射 | ❌ 不存在 | ❌ localhost:8545 |

### 为什么 RPC_0 没有生成？

**推测**: 部署生成器的逻辑：

1. 读取 `config.json:env_variables`
2. 生成 `SKILL_*` 开头的环境变量 ✅
3. 生成 `CONNECTION_*` 开头的环境变量 ✅
4. **但没有**生成 `RPC_0`, `RPC_1` 这类变量 ❌

**原因**: 这些变量可能期望由其他机制提供（如 Docker Compose 的 environment 块）

### 检查 docker-compose.yaml

**文件**: `.operate/services/sc-*/deployment/docker-compose.yaml`

```yaml
traderxFxm_abci_0:
  image: valory/oar-trader:...
  env_file: agent_0.env  # 只有 env_file
  # 缺少 environment 块！
```

**如果 docker-compose.yaml 有**:
```yaml
environment:
  - RPC_0=${GNOSIS_LEDGER_RPC}
```

那么可以从外部注入。但当前没有。

---

## 📋 完整的修复步骤（推荐）

### 步骤 1: 修复 RPC 配置

```bash
echo "RPC_0=https://rpc.gnosischain.com" >> \
  /Users/andydeng/Downloads/quickstart-main-2/.operate/services/sc-576c3277-2abc-498b-a3b8-c0a1538c9a51/deployment/agent_0.env
```

### 步骤 2: 修复 OPENING_MARGIN

编辑 `configs/config_supafund.json`:
```json
{
  "OPENING_MARGIN": {
    "value": "3600"  // 改回 3600
  }
}
```

### 步骤 3: 验证其他配置

确认 `configs/config_supafund.json` 中有：
```json
{
  "LANGUAGES": {
    "value": "[\"en\"]"  // ✅
  },
  "CREATOR_PER_SUBGRAPH": {  // 确认存在
    "value": "{\"omen_subgraph\":[\"0xafd5806e1fc7f706236e2f294ab1745a26bdb720\"]}"
    // 注意：全小写更保险
  }
}
```

### 步骤 4: 重新部署

```bash
./stop_service.sh configs/config_supafund.json
./start_supafund.sh
```

### 步骤 5: 验证

**检查 RPC**:
```bash
grep "^RPC_0" .operate/services/sc-*/deployment/agent_0.env
# 应该看到: RPC_0=https://rpc.gnosischain.com
```

**检查日志**:
```bash
docker logs $(docker ps -q --filter "name=abci") --tail 50

# 应该看到:
# [INFO] Retrieved questions: [0x...]  # 不再是 []
# 不应该看到 "Connection refused"
```

---

## 🧪 验证查询逻辑

### 手动测试 Subgraph 查询

使用修正后的参数测试：

```bash
python3 << 'EOF'
import time
import json

current_time = int(time.time())
opening_margin = 3600  # 1小时（修正后）
opening_threshold = current_time + opening_margin

query = {
  "query": f'''{{
    fixedProductMarketMakers(
      where: {{
        creator_in: ["0xafd5806e1fc7f706236e2f294ab1745a26bdb720"],
        openingTimestamp_gt: {opening_threshold},
        language_in: ["en"],
        outcomeSlotCount: 2,
        isPendingArbitration: false
      }},
      first: 10
    ) {{ id title openingTimestamp }}
  }}'''
}

print("查询条件:")
print(f"  current_time: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(current_time))}")
print(f"  OPENING_MARGIN: {opening_margin} 秒")
print(f"  opening_threshold: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(opening_threshold))}")
print()
print("GraphQL:")
print(json.dumps(query, indent=2))
EOF
```

**预期结果**: 应该能找到 2025-10-28 开放的市场。

---

## 📊 问题关系图

```
┌─────────────────────────────────────────┐
│  用户误解 OPENING_MARGIN 含义            │
│  设置为 560000 秒（6.5天）               │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  查询条件: openingTimestamp > now+6.5天 │
│  现有市场: 2025-10-16, 2025-10-28       │
│  结果: 所有市场 < now+6.5天 → 被过滤    │
└────────────────┬────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │ Retrieved: []  │
        └────────────────┘

┌─────────────────────────────────────────┐
│  RPC_0 环境变量未设置                    │
│  (部署生成器未映射 config.json 的 RPC)  │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  使用 service.yaml 默认值:              │
│  localhost:8545 (Hardhat 测试节点)      │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Hardhat 未运行                          │
│  → Connection refused                   │
└────────────────┬────────────────────────┘
                 │
                 ▼
     ┌────────────────────────┐
     │ 链上操作全部失败        │
     │ (Staking, Balance等)   │
     └────────────────────────┘
```

---

## 🎬 总结

### 根本原因清单

1. ✅ **RPC_0 未设置** - 导致连接 localhost:8545 失败
2. ✅ **OPENING_MARGIN=560000** - 时间窗口过远，查不到市场
3. ⚠️ **地址大小写** - 可能影响查询（待验证）
4. ✅ **语言 en vs en_US** - 已修复，待重新部署验证

### 必须修复

- 🔴 **RPC_0 配置** - 否则无法与链交互
- 🔴 **OPENING_MARGIN** - 否则查不到市场

### 可选优化

- 🟡 创建者地址改为全小写
- 🟡 验证所有环境变量是否正确生成

### 预期效果

修复后应该看到：
```
[INFO] Retrieved questions: ['0xf4ba5ddf3ac3a6562bb0e71980ed63e15bf37657', ...]
[INFO] Updated bets: [...]
[INFO] Successfully queried staking state
```

不应该再看到：
```
[ERROR] Connection refused
[ERROR] Failed to establish connection to host.docker.internal:8545
[INFO] Retrieved questions: []
```

---

**生成时间**: 2025-10-23 17:30
**分析者**: Claude Code
**完整性**: ✅ 源码级分析完成
