# Button Debug Guide

## 问题：按钮灰色的所有可能原因

根据代码分析（AgentNotRunningButton.tsx 第80-131行），`isDeployable` 需要满足以下所有条件：

### 1. ✅ 余额加载完成
```typescript
if (isBalancesAndFundingRequirementsLoading) return false;
```
**状态**: ✅ 后端返回了数据

### 2. ✅ 服务未运行
```typescript
if (isServicesLoading || isServiceRunning) return false;
```
**状态**: ✅ 服务未运行（没有 Docker 容器）

### 3. ❓ Staking 合约信息已加载
```typescript
if (!isAllStakingContractDetailsRecordLoaded) return false;
```
**可能原因**: Staking 合约信息加载失败或超时

### 4. ❓ Agent 配置检查
```typescript
if (selectedAgentConfig.isUnderConstruction && !selectedAgentConfig.hasExternalFunds)
  return false;
```
**检查**: Trader Agent 是否标记为 "under construction"？

### 5. ✅ Staking Program 未废弃
```typescript
if (selectedStakingProgramMeta?.deprecated) return false;
```
**状态**: ✅ supafund_test 未废弃

### 6. ❓ Service Slots 检查
```typescript
const hasSlot = !isNil(hasEnoughServiceSlots) && !hasEnoughServiceSlots;
if (hasSlot && !isServiceStaked) return false;
```
**可能原因**: Staking 合约已满，没有 slot

### 7. ❓ Eviction 检查
```typescript
if (isAgentEvicted && !isEligibleForStaking) return false;
```

### 8. ✅ Funding 检查
```typescript
if (!selectedService && isInitialFunded) return !needsInitialFunding;
```

### 9. ❓ Agents.fun 特定检查
```typescript
if (isAgentsFunFieldUpdateRequired) return false;
```

### 10. ✅ 后端允许启动
```typescript
return canStartAgent;  // ← 后端返回 allow_start_agent: true
```
**状态**: ✅ 后端允许

## 诊断步骤

### 在浏览器控制台运行：

```javascript
// 1. 检查所有条件
console.log({
  isBalancesLoading: window.__balancesLoading,
  isServicesLoading: window.__servicesLoading,
  isServiceRunning: window.__serviceRunning,
  isStakingContractLoaded: window.__stakingLoaded,
  canStartAgent: window.__canStartAgent,
  isDeployable: window.__isDeployable
});

// 2. 查找 React Query 缓存
window.__REACT_QUERY_STATE__ = window.queryClient?.getQueryCache().getAll()
  .map(q => ({
    key: q.queryKey,
    state: q.state.status,
    data: q.state.data
  }));
console.log(window.__REACT_QUERY_STATE__);
```

## 最可能的原因

1. **Staking 合约信息加载失败**
   - RPC 调用失败
   - Multicall 错误
   - 网络超时

2. **Agent 配置标记为 "under construction"**
   - Trader Agent 可能被标记为施工中

3. **前端缓存未更新**
   - 需要强制刷新
   - React Query 缓存问题

## 解决方案

### 方案 1: 强制刷新浏览器
```bash
# 在浏览器中按
Cmd+Shift+R (macOS)
Ctrl+Shift+R (Windows/Linux)
```

### 方案 2: 清除 localStorage 缓存
在浏览器控制台运行：
```javascript
localStorage.clear();
location.reload();
```

### 方案 3: 重启前端
```bash
# 终端2
Ctrl+C
yarn dev
```

### 方案 4: 检查是否是 Trader Agent 问题
创建真正的 Supafund 服务而不是 Trader：
```bash
cd /Users/andydeng/Downloads/quickstart-main-2
python3 create_supafund_service.py
```
