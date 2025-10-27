# 服务选择逻辑分析

## 当前状态

```
后端服务:
  name: "Trader Agent"
  hash: bafybeicav6czopdtsenpfsozub5pqcnfdbhy7ys2komiu7x2vviutp2ice (Trader hash)
  chain: gnosis

前端选择:
  agentType: "supafund"
  期望 name: "Supafund Agent"
```

## ServicesProvider 的选择逻辑（第271-298行）

```typescript
useEffect(() => {
  if (!selectedAgentConfig) return;
  if (isNilOrEmpty(services)) return;

  // 1. 根据当前选择的 agentType，找到对应的 template
  const targetServiceName = SERVICE_TEMPLATES.find(
    (t) => t.agentType === selectedAgentType,
  )?.name;
  // → 如果 selectedAgentType = "supafund"
  //    targetServiceName = "Supafund Agent"

  // 2. 筛选候选服务
  const candidates = services.filter(({ home_chain, name }) =>
    home_chain === selectedAgentConfig.middlewareHomeChainId &&
    (!!targetServiceName ? name === targetServiceName : true),
  );
  // → 筛选条件:
  //    home_chain === "gnosis" ✅
  //    name === "Supafund Agent" ❌ (实际是 "Trader Agent")
  // → candidates = [] （空数组）

  const currentService = stakedCandidate ?? candidates[0];
  // → currentService = undefined

  if (!currentService) {
    setSelectedServiceConfigId(null);  // ← 设为 null！
    return;
  }
}, [selectedServiceConfigId, services, selectedAgentConfig, selectedAgentType]);
```

## 为什么会出现这种情况？

### 可能的场景：

1. **用户先选择了 PredictTrader**
   → 创建了 Trader Agent 服务
   → name = "Trader Agent"

2. **用户后来切换到 Supafund**
   → localStorage: agentType = "supafund"
   → 但服务还是 Trader Agent

3. **筛选逻辑失败**
   → 找不到名为 "Supafund Agent" 的服务
   → selectedServiceConfigId = null
   → 所有依赖 configId 的查询变成 pending

## 为什么这是设计问题

### Pearl 的设计假设：

Pearl 预期用户：
1. 选择一个 agent type
2. 创建对应的服务
3. 如果切换 agent type，会有对应的服务

**但用户现在的情况**：
- 选择了 Supafund
- 但只有 Trader 服务
- 系统没有引导创建 Supafund 服务

### 正确的用户流程应该是：

1. 用户选择 Supafund
2. 系统检测：没有 Supafund 服务
3. 显示 "Create Service" 按钮或引导界面
4. 用户创建 Supafund 服务
5. 服务自动被选中

## 当前的问题

**系统卡在了中间状态**：
- agentType = Supafund
- 只有 Trader 服务
- 没有引导创建新服务

## 解决方案

### 方案 1: 修改服务的 name（最快）

直接改配置文件让它匹配：

```bash
# 修改服务 name 为 "Supafund Agent"
```

### 方案 2: 理解 UI 流程

查看 UI 中是否应该有 "Create Service" 或 "Switch Agent" 按钮。
