# 暴露 QueryClient 到 Window

## 问题

`window.queryClient` 可能未定义，因为它没有被暴露到全局作用域。

## 解决方案

需要修改 `_app.tsx` 来暴露 queryClient。

但在修改之前，让我们先用另一个方法检查 queries。

## 使用 React DevTools 检查

### 步骤 1: 安装 React Query DevTools（临时）

在浏览器控制台运行：

```javascript
// 临时添加 React Query DevTools 的DOM
const script = document.createElement('script');
script.src = 'https://unpkg.com/@tanstack/react-query-devtools@5/build/modern/production.js';
document.head.appendChild(script);

setTimeout(() => {
  console.log('DevTools loaded, but needs to be integrated into React tree');
}, 2000);
```

这个方法可能不work，因为需要在React树中集成。

### 更好的方法：检查网络标签

1. **打开 Network 标签**
2. **过滤**: 输入 `localhost:8000`
3. **刷新页面**
4. **观察**:
   - 能看到任何请求吗？
   - 如果能，返回的状态码是什么？
   - 如果不能，说明查询确实没运行

## 关键问题

**请在浏览器中做这个实验：**

### 实验 1: 直接查看网络请求

1. F12 → Network 标签
2. 刷新页面（Cmd+R）
3. 看有没有对 `localhost:8000` 的请求
4. **截图或告诉我看到了什么**

### 实验 2: 手动触发登录

即使已经登录，再次触发登录，看看会发生什么：

在控制台运行（用您的实际密码）：

```javascript
fetch('http://localhost:8000/api/account/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: 'YOUR_ACTUAL_PASSWORD' })
})
.then(r => r.json())
.then(result => {
  console.log('Login result:', result);
  if (result.message === 'Login successful.') {
    console.log('✅ Backend logged in');
    console.log('Now refreshing page...');
    localStorage.setItem('pearl_store_isUserLoggedIn', 'true');
    location.reload();
  }
})
```

## 我的最终假设

基于所有证据，我认为问题是：

1. ✅ 后端正常
2. ✅ 浏览器能访问后端
3. ❌ 但React Provider层级中某个地方阻止了查询启动
4. ❌ 可能是OnlineStatusProvider初始化时机问题
5. ❌ 或者StoreProvider未正确加载storeState

**最直接的测试：看Network标签是否有请求！**
