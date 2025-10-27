# Browser Console Debug Commands

## 🔍 在浏览器控制台运行这些命令来诊断按钮问题

打开浏览器 (http://localhost:3000)，按 `F12` 或 `Cmd+Option+I` 打开开发者工具，切换到 Console 标签，然后依次运行：

### 1. 检查 React Query 缓存状态

```javascript
// 获取所有查询状态
const queries = window.queryClient?.getQueryCache().getAll() || [];
const balanceQuery = queries.find(q =>
  JSON.stringify(q.queryKey).includes('BALANCES_AND_REFILL')
);

console.log('🔍 Balance Query Status:', {
  state: balanceQuery?.state.status,
  dataUpdatedAt: balanceQuery?.state.dataUpdatedAt,
  error: balanceQuery?.state.error,
  allow_start_agent: balanceQuery?.state.data?.allow_start_agent,
  is_refill_required: balanceQuery?.state.data?.is_refill_required
});
```

### 2. 检查 Staking Contract 加载状态

```javascript
// 查找 staking 相关的查询
const stakingQueries = queries.filter(q =>
  JSON.stringify(q.queryKey).includes('STAKING')
);

console.log('🏦 Staking Queries:', stakingQueries.length);
stakingQueries.forEach((q, i) => {
  console.log(`   ${i+1}. ${JSON.stringify(q.queryKey)}`);
  console.log(`      Status: ${q.state.status}`);
  if (q.state.error) {
    console.log(`      Error: ${q.state.error}`);
  }
});
```

### 3. 检查所有失败的查询

```javascript
// 找出所有失败的查询
const failedQueries = queries.filter(q => q.state.status === 'error');

console.log('❌ Failed Queries:', failedQueries.length);
failedQueries.forEach(q => {
  console.log(`   Key: ${JSON.stringify(q.queryKey)}`);
  console.log(`   Error: ${q.state.error?.message || q.state.error}`);
});
```

### 4. 强制重新获取余额

```javascript
// 手动触发余额刷新
const balanceKey = queries.find(q =>
  JSON.stringify(q.queryKey).includes('BALANCES_AND_REFILL')
)?.queryKey;

if (balanceKey) {
  window.queryClient?.invalidateQueries({ queryKey: balanceKey });
  console.log('✅ Balance query invalidated, refreshing...');

  // 等待 3 秒后检查
  setTimeout(() => {
    const updated = window.queryClient?.getQueryCache()
      .find({ queryKey: balanceKey });
    console.log('Updated allow_start_agent:',
      updated?.state.data?.allow_start_agent
    );
  }, 3000);
}
```

### 5. 清除所有缓存并重新加载

```javascript
// 核武器选项：清除一切
console.log('💣 Clearing all caches...');
localStorage.clear();
sessionStorage.clear();
window.queryClient?.clear();
console.log('✅ All caches cleared');
console.log('🔄 Reloading page in 2 seconds...');
setTimeout(() => location.reload(), 2000);
```

## 📊 预期结果

### 如果一切正常：
```javascript
{
  allow_start_agent: true,  // ✅
  is_refill_required: false, // ✅
  failed_queries: 0          // ✅
}
```

### 如果有问题：
- ❌ Staking queries 显示 error
- ❌ allow_start_agent 为 false
- ❌ 有 RPC CORS 错误

## 🔧 根据结果修复

### 如果看到 RPC 错误：
前端的 RPC 配置有问题，即使我们设置了 Alchemy。

### 如果看到 "loading" 状态卡住：
某些查询一直在 loading，可能需要：
```javascript
// 取消所有正在进行的查询
window.queryClient?.cancelQueries();
// 然后刷新
location.reload();
```

### 如果 allow_start_agent 为 false：
后端逻辑认为不能启动，需要检查后端日志。

## 🎯 最简单的修复（90% 概率有效）

在控制台直接运行：

```javascript
localStorage.clear();
location.reload();
```

然后等待页面重新加载，按钮应该会变成可点击的。
