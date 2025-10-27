# 根本原因分析

## 问题链条

```
1. [创建时] 前端发送 Trader template
   ↓
2. [Middleware] 创建服务 name="Trader Agent", hash=Trader hash
   ↓
3. [后来] 用户切换到 Supafund
   ↓
4. [ServicesProvider] 筛选逻辑找不到名为 "Supafund Agent" 的服务
   ↓
5. [结果] selectedServiceConfigId = null
   ↓
6. [连锁] 所有依赖 configId 的查询变成 pending
   ↓
7. [最终] 按钮灰色
```

## 核心断点

**ServicesProvider.tsx 第 280-283 行**：

```typescript
const candidates = services.filter(({ home_chain, name }) =>
  home_chain === selectedAgentConfig.middlewareHomeChainId &&
  (!!targetServiceName ? name === targetServiceName : true),  // ← 这里
);
```

当前状态：
- `targetServiceName = "Supafund Agent"` (从 agentType="supafund" 推导)
- `service.name = "Trader Agent"` (从后端获取)
- 不匹配 → `candidates = []`
- `selectedServiceConfigId = null`

## 为什么服务名不匹配？

### 可能原因 1: UI 流程问题

Pearl 可能没有提供"为不同 agent 创建多个服务"的 UI 流程。

设计假设：
- 每个用户只运行一个 agent
- Agent 类型切换意味着重新配置同一个服务

但实际上：
- 不同 agent 有不同的 service template
- 不同的 hash, name, 配置
- 不能简单"切换"

### 可能原因 2: 服务创建时的 bug

前端在某个时刻用了错误的 template 创建服务。

## 根本设计问题

Pearl 的服务选择逻辑基于 **name 匹配**，这在以下场景会失败：

1. 用户创建了 Agent A 的服务
2. 用户切换到 Agent B
3. 没有 Agent B 的服务
4. 系统找不到匹配服务 → configId = null
5. 所有功能失效

### Pearl Electron App 如何处理？

在 Electron 环境中，可能：
- 有更好的服务管理 UI
- 自动引导创建新服务
- 或者限制只能有一个 agent

## 临时解决方案（不修改代码）

既然设计如此，最简单的方法是：

1. **删除 Trader 服务**
2. **创建 Supafund 服务**
3. **确保 agentType 和服务匹配**

这样：
- selectedAgentType = "supafund"
- service.name = "Supafund Agent"
- 匹配成功 ✅
- selectedServiceConfigId 被设置
- 查询运行
- 按钮可用
