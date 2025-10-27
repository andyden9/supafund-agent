# Pearl 服务选择流程 - 完整追踪

## 🔍 用户当前状态

```
✅ 已登录
✅ 选择了 agentType = "supafund"
✅ 后端有 1 个服务（Trader Agent）
❌ selectedServiceConfigId = null （因为服务不匹配）
❌ 所有查询 pending（因为 configId = null）
❌ 按钮灰色（因为 isBalancesAndFundingRequirementsLoading = true）
```

## 🎯 断点位置

**ServicesProvider.tsx 第 271-298 行**的 `useEffect`:

```typescript
useEffect(() => {
  if (!selectedAgentConfig) return;
  if (isNilOrEmpty(services)) return;  // ← 服务列表不为空，继续

  // 获取期望的服务名称
  const targetServiceName = SERVICE_TEMPLATES.find(
    (t) => t.agentType === selectedAgentType,  // "supafund"
  )?.name;
  // → targetServiceName = "Supafund Agent"

  // 筛选候选服务
  const candidates = services.filter(({ home_chain, name }) =>
    home_chain === selectedAgentConfig.middlewareHomeChainId &&  // "gnosis" ✅
    (!!targetServiceName ? name === targetServiceName : true),   // "Supafund Agent" ❌
  );
  // → 筛选结果:
  //    后端服务 name = "Trader Agent"
  //    期望 name = "Supafund Agent"
  //    不匹配！
  // → candidates = []

  const currentService = stakedCandidate ?? candidates[0];
  // → currentService = undefined

  if (!currentService) {
    setSelectedServiceConfigId(null);  // ← 这里！设为 null
    return;
  }
}, [selectedServiceConfigId, services, selectedAgentConfig, selectedAgentType]);
```

## 🤔 为什么会到这个状态？

### 可能的场景：

**场景 1：用户切换了 Agent Type**
1. 用户最初选择 Trader → 创建了 Trader 服务
2. 用户切换到 Supafund
3. localStorage 更新为 "supafund"
4. 但 Trader 服务还在
5. 筛选逻辑找不到 Supafund 服务
6. selectedServiceConfigId = null

**场景 2：服务创建时出错**
1. 用户选择 Supafund
2. 但创建时使用了错误的 template
3. 创建了 Trader 服务但 localStorage 记住了 Supafund

## ❓ Pearl 设计的预期行为

### 当没有匹配服务时应该怎么办？

让我检查当 selectedService = undefined 时，UI 应该显示什么...
