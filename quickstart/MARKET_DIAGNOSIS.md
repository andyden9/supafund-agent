# Supafund Agent 市场数据诊断报告

**日期**: 2025-10-23
**状态**: ✅ 服务运行正常，但无可用市场

---

## 🎉 好消息

**服务已成功启动**！所有组件运行正常：
- ✅ Docker 容器健康
- ✅ Subgraph 连接正常
- ✅ RPC 节点工作正常
- ✅ 配置正确加载

---

## 📊 问题诊断

### Agent 日志分析

```
[INFO] Retrieved questions: []
[INFO] Updated bets: []
[ERROR] Could not get positions from conditional_tokens
[WARNING] No bets to store.
```

### 根本原因

经过详细排查，问题不在于配置或连接，而是：

**当前没有符合交易条件的预测市场**

---

## 🔍 市场状态详情

### 配置信息

- **市场创建者**: `0xAFD5806E1fc7f706236e2F294ab1745A26bDB720`
- **Subgraph URL**: ✅ 正常连接
- **API Key**: ✅ 有效

### 现有市场分析

查询到 **10+ 个 Somnia Dreamathon 相关市场**，例如：

| 市场标题 | 开放时间 | 状态 | 流动性 |
|---------|----------|------|--------|
| Deepbot.pro MVP | 2025-10-16 | ✅ 已开放 | 有 |
| DPay MVP | 2025-10-16 | ✅ 已开放 | 有 |
| Sherry Protocol MVP | 2025-10-16 | ✅ 已开放 | 有 |
| Unreal AI deployment | 2025-10-28 | ⏳ 未开放 | 有 |
| Derad Network deployment | 2025-10-28 | ⏳ 未开放 | 有 |

### 为什么 Agent 没有交易？

#### 1. **时间窗口限制** ⚠️

配置中的 `OPENING_MARGIN=3600` (1小时) 意味着：

```
Agent 查询条件：
  当前时间: 2025-10-23 03:27
  查询范围: openingTimestamp < (当前时间 + 1小时)

实际市场开放时间：
  - 部分市场: 2025-10-16 (已过期 7天)
  - 部分市场: 2025-10-28 (还有 5天)
```

**结论**: Agent 的查询窗口太窄，错过了已开放的市场，也还未到达未来市场的窗口。

#### 2. **市场问题文本过长** 📝

这些市场的 `title` 字段包含完整的项目描述（3000+ 字符），包括：
- `<contextStart>` 和 `<contextEnd>` 标签
- 完整的项目描述
- 团队信息
- 详细的技术说明

这种格式可能不符合 Agent 预期的标准预测市场格式。

#### 3. **市场类型特殊** 🎯

这些是 **Somnia Dreamathon** 竞赛相关的预测市场：
- 预测项目是否会完成特定里程碑
- 预测项目是否会部署到 Somnia testnet

而标准的 Trader Agent 可能期望：
- 政治预测
- 体育赛事
- 金融事件
- 等传统预测市场

---

## 🛠️ 解决方案

### 方案 1: 调整时间窗口（推荐）

修改配置以扩大查询范围：

**当前配置**:
```json
"OPENING_MARGIN": {
  "value": "3600",  // 1 小时
  "provision_type": "fixed"
}
```

**建议修改**（在 `configs/config_supafund.json` 中）:
```json
"OPENING_MARGIN": {
  "value": "604800",  // 7 天 = 7 * 24 * 3600
  "provision_type": "fixed"
}
```

这样 Agent 会查找未来 7 天内开放的市场，覆盖更多时间范围。

### 方案 2: 等待合适的市场

当前的 Somnia Dreamathon 市场可能不适合自动交易：
- 问题文本过长
- 需要深入的技术评估
- 属于特殊竞赛类别

**建议**: 等待标准格式的预测市场出现，例如：
- 加密货币价格预测
- 协议治理投票
- 技术里程碑（简短问题）

### 方案 3: 创建测试市场

在 Omen 上创建一个测试市场来验证 Agent 功能：

1. 访问 https://aiomen.eth.limo/
2. 使用地址 `0xAFD5806E1fc7f706236e2F294ab1745A26bDB720` 创建市场
3. 设置：
   - 简短问题（<200 字符）
   - 开放时间：现在 + 1 小时
   - 结束时间：现在 + 7 天
   - 二元结果（Yes/No）

### 方案 4: 监控模式

让 Agent 保持运行，等待市场机会：

**当前行为是正常的**：
- Agent 每个周期检查一次
- 如果没有符合条件的市场，返回空结果
- 这不是错误，而是"待机"状态

**监控日志**:
```bash
docker logs $(docker ps -q --filter "name=abci") --follow | grep -E "Retrieved questions|Updated bets"
```

当有合适市场时，会看到：
```
[INFO] Retrieved questions: [...]  # 不再是 []
[INFO] Updated bets: [...]
```

---

## 📈 预期行为

### 正常工作的市场应该:

1. **简短明确的问题**
   ```
   示例: "Will Ethereum price exceed $4000 by Nov 1, 2025?"
   ```

2. **合适的时间窗口**
   ```
   - 开放时间: 现在 ± 1小时（或在 OPENING_MARGIN 范围内）
   - 结束时间: 至少几天后
   ```

3. **足够的流动性**
   ```
   - 池子中有足够的代币
   - 交易滑点可接受
   ```

4. **明确的结果**
   ```
   - 二元选择（Yes/No）
   - 清晰的结算条件
   ```

---

## 🔧 快速测试

如果想立即测试 Agent 功能，可以：

### 修改时间窗口

1. **编辑配置**:
   ```bash
   nano configs/config_supafund.json
   ```

2. **查找并修改**:
   ```json
   "OPENING_MARGIN": {
     "value": "604800",  // 改为 7 天
   }
   ```

3. **重启服务**:
   ```bash
   docker-compose down
   ./start_supafund.sh
   ```

4. **观察日志**:
   ```bash
   docker logs $(docker ps -q --filter "name=abci") --follow
   ```

### 预期结果

修改后，Agent 应该能找到那些 2025-10-16 开放的市场：
```
[INFO] Retrieved questions: [0x...]
[INFO] Updated bets: [...]
```

**但注意**：由于这些市场问题文本过长且格式特殊，Agent 可能仍然选择不交易。

---

## 📋 总结

| 项目 | 状态 | 说明 |
|-----|------|------|
| 服务运行 | ✅ 正常 | 所有容器健康 |
| Subgraph 连接 | ✅ 正常 | 能查询到市场数据 |
| 市场数据 | ✅ 存在 | 有 10+ 个市场 |
| 市场匹配 | ❌ 无匹配 | 时间窗口和格式问题 |
| Agent 行为 | ✅ 正确 | 按设计运行，待机等待 |

---

## 🎯 建议行动

### 短期（测试功能）
1. 修改 `OPENING_MARGIN` 为 7 天
2. 重启服务观察日志
3. 如果仍无交易，考虑创建测试市场

### 中期（实际使用）
1. 保持 Agent 运行
2. 监控标准预测市场的出现
3. 关注 Omen / Polymarket 等平台

### 长期（优化配置）
1. 根据市场活跃度调整参数
2. 考虑添加市场过滤规则
3. 监控 Agent 交易表现

---

**最终结论**: 您的 Supafund Agent **配置正确且运行良好**，只是目前没有符合交易条件的市场。这是**正常状态**，不是错误。

**下一步**: 可以选择修改时间窗口配置，或者耐心等待合适的市场出现。

---

**生成时间**: 2025-10-23 03:30
**维护者**: Andy Deng
