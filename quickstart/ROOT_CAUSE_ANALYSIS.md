# 市场获取失败的根本原因分析

**日期**: 2025-10-23
**状态**: 已识别多个可能原因

---

## 🔍 问题现象

即使扩大了 `OPENING_MARGIN` 到 560000 秒（6.5天），Agent 仍然返回：
```
[INFO] Retrieved questions: []
```

---

## 📋 已识别的可能原因

### 1. 🔴 语言过滤不匹配（高可能性）

**配置要求**:
```
LANGUAGES=["en_US"]
```

**市场实际语言**:
```json
{
  "language": "en"  // ❌ 不是 "en_US"
}
```

**问题**:
- Agent 期望 `en_US`（美式英语）
- 市场标记为 `en`（通用英语）
- 字符串严格匹配会导致过滤失败

**证据**: 查询到的所有 Supafund 市场都是 `language: "en"`

---

### 2. 🟡 地址大小写敏感（中等可能性）

**配置中的创建者地址**:
```
0xAFD5806E1fc7f706236e2F294ab1745A26bDB720  // 混合大小写（EIP-55 校验和格式）
```

**Subgraph 中的地址**:
```
0xafd5806e1fc7f706236e2f294ab1745a26bdb720  // 全小写
```

**问题**:
- Ethereum 地址不区分大小写（从协议角度）
- 但某些实现可能进行字符串严格比较
- 如果 Agent 使用 `===` 而不是 `.toLowerCase()` 比较，会失败

**测试结果**:
```python
config_address.lower() == market_address.lower()  # True
config_address == market_address  # False ❌
```

---

### 3. 🟡 问题文本格式异常（中等可能性）

**市场标题示例**:
```
"Will Derad Network deploy on Somnia testnet by October 27, 2025?
<contextStart>
project_description: Sustainable and efficient flight tracking network...
[3000+ 字符的详细描述]
<contextEnd>"
```

**异常特征**:
1. **超长文本** (3000+ 字符 vs 标准 100-300 字符)
2. **结构化标签** (`<contextStart>`, `<contextEnd>`)
3. **多字段混合** (project_description, problem_statement, team_details等)

**可能的过滤逻辑**:
```python
# Agent 可能有类似这样的检查：
if len(question_text) > 500:  # 过滤超长问题
    continue

if '<contextStart>' in question_text:  # 过滤特殊格式
    continue

if not is_standard_prediction_format(question):  # 格式验证
    continue
```

---

### 4. 🟢 流动性检查（低可能性）

**市场流动性**:
```json
{
  "collateralVolume": "375665995106564413",  // ~0.376 xDAI
  "outcomeTokenAmounts": [
    "156185722692348283",    // ~0.156 xDAI (Yes)
    "640263388203404"        // ~0.0006 xDAI (No)
  ]
}
```

**配置要求**:
```
BET_THRESHOLD = 100000000000000000  // 0.1 xDAI
```

**分析**:
- 市场总流动性 > 0.3 xDAI ✅
- 但 "No" 侧流动性极低（0.0006 xDAI）❌
- Agent 可能检查**双向流动性**都要满足阈值

**可能的逻辑**:
```python
# 检查两个结果的流动性都要足够
if min(outcomeTokenAmounts) < BET_THRESHOLD:
    # 跳过流动性不平衡的市场
    continue
```

---

### 5. 🟢 市场状态过滤（低可能性）

**市场状态字段**:
```json
{
  "currentAnswer": null,           // 未结算 ✅
  "answerFinalizedTimestamp": null, // 未最终化 ✅
  "openingTimestamp": "1761609540"  // 未来开放 ✅
}
```

**分析**: 市场状态看起来正常，不太可能是这个原因

---

### 6. 🟡 Subgraph 查询参数问题（中等可能性）

**Agent 的实际查询可能包含更多条件**:

```graphql
{
  fixedProductMarketMakers(
    where: {
      creator_in: ["0xAFD5806E1fc7f706236e2F294ab1745A26bDB720"],  # 注意大小写
      language_in: ["en_US"],                                      # 严格匹配
      openingTimestamp_gte: <current_time>,
      openingTimestamp_lte: <current_time + OPENING_MARGIN>,
      collateralVolume_gte: <某个阈值>,
      outcomeSlotCount: 2,                                         # 只要二元市场
      # 可能还有其他未知条件
    }
  ) { ... }
}
```

任何一个 WHERE 条件不匹配都会导致返回空结果。

---

### 7. 🟢 时区或时间戳计算问题（低可能性）

**理论问题**:
- Agent 运行在 Docker 容器中
- 容器时区可能与宿主机不同
- 时间戳计算可能有偏差

**检查**:
```bash
docker exec <container> date
# vs
date
```

但这个可能性较低，因为所有时间戳都应该是 UTC。

---

## 🎯 最可能的原因排序

### 1. **语言过滤不匹配** 🔴 (90% 可能性)
```
配置: "en_US"
市场: "en"
=> 字符串不匹配 => 过滤掉所有市场
```

### 2. **问题文本格式异常** 🟡 (70% 可能性)
```
市场标题 >3000 字符
包含 <contextStart> 标签
=> 格式验证失败 => 过滤掉
```

### 3. **地址大小写敏感** 🟡 (50% 可能性)
```
配置: 0xAFD...（混合）
查询: 0xafd...（小写）
=> 地址不匹配 => 返回空结果
```

### 4. **流动性不平衡** 🟢 (30% 可能性)
```
Yes: 0.156 xDAI ✅
No: 0.0006 xDAI ❌
=> 最小值检查失败 => 过滤掉
```

---

## 🔬 验证方法

### 验证语言问题

查看 Agent 源码中的语言过滤逻辑：
```bash
grep -r "LANGUAGES\|language" \
  /Users/andydeng/Library/Caches/pypoetry/virtualenvs/*/lib/python3.10/site-packages/*/skills/market_manager_abci
```

### 验证地址问题

尝试用小写地址查询：
```json
{
  "CREATOR_PER_SUBGRAPH": {
    "omen_subgraph": ["0xafd5806e1fc7f706236e2f294ab1745a26bdb720"]
  }
}
```

### 验证文本长度问题

查看是否有长度限制：
```bash
grep -r "len(.*title\|len(.*question" \
  /path/to/market_manager_skill
```

---

## 📊 证据总结

| 原因 | 证据 | 可能性 |
|------|------|--------|
| 语言不匹配 | `"en"` ≠ `"en_US"` | 🔴 90% |
| 文本格式 | 3000+ 字符，特殊标签 | 🟡 70% |
| 地址大小写 | 混合 vs 小写 | 🟡 50% |
| 流动性 | No侧仅 0.0006 xDAI | 🟢 30% |

---

## 🧪 建议的诊断步骤

### 步骤 1: 启用调试日志

查看 Agent 的实际 GraphQL 查询：
```bash
# 查找日志中的查询语句
docker logs <container> 2>&1 | grep -i "query\|graphql" | head -20
```

### 步骤 2: 检查配置是否生效

确认修改的 OPENING_MARGIN 已加载：
```bash
docker exec <container> env | grep OPENING_MARGIN
```

### 步骤 3: 查看完整的市场查询逻辑

找到源码中的市场获取函数：
```bash
find /Users/andydeng/Library/Caches/pypoetry/virtualenvs \
  -name "*.py" -path "*/market_manager_abci/*" -type f
```

---

## 💡 快速测试

### 测试 1: 修改语言配置

```json
{
  "LANGUAGES": {
    "value": "[\"en\"]",  // 改为 "en" 而不是 "en_US"
  }
}
```

### 测试 2: 修改创建者地址

```json
{
  "CREATOR_PER_SUBGRAPH": {
    "value": "{\"omen_subgraph\": [\"0xafd5806e1fc7f706236e2f294ab1745a26bdb720\"]}",
    // 改为全小写
  }
}
```

### 测试 3: 直接查询验证

使用 Agent 的地址和语言设置查询 Subgraph：
```bash
curl -X POST "https://gateway-arbitrum.network.thegraph.com/..." \
  -d '{"query": "{ fixedProductMarketMakers(where: {creator: \"0xAFD5806E1fc7f706236e2F294ab1745A26bDB720\", language: \"en_US\"}) { id } }"}'
```

如果返回空，说明是过滤条件问题。

---

## 🎬 结论

**最可能的原因组合**:

1. **语言过滤** (`en` vs `en_US`) - 导致所有市场被过滤
2. **文本格式** (超长 + 特殊标签) - 即使通过语言过滤也会被二次过滤
3. **地址格式** - 可能导致 Subgraph 查询直接返回空

这三个问题**可能同时存在**，需要逐一排除。

**建议的修复优先级**:
1. 先修改 LANGUAGES 为 `["en"]`
2. 观察是否能获取到市场
3. 如果仍失败，修改创建者地址为小写
4. 如果还失败，检查问题文本长度限制

---

**生成时间**: 2025-10-23 03:50
**分析者**: Claude Code
