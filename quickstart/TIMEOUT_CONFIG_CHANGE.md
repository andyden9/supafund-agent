# 超时配置修改记录

**修改时间**: 2025-10-23
**修改文件**: autonomy/chain/tx.py
**修改原因**: 解决 Gnosis 链交易超时问题

## 修改内容

### 修改前
```python
DEFAULT_ON_CHAIN_INTERACT_TIMEOUT = 60.0   # 超时时间：60秒
DEFAULT_ON_CHAIN_INTERACT_RETRIES = 5.0    # 重试次数：5次  
DEFAULT_ON_CHAIN_INTERACT_SLEEP = 3.0      # 重试间隔：3秒
```

**总等待时间**: 最多 60 秒

### 修改后
```python
DEFAULT_ON_CHAIN_INTERACT_TIMEOUT = 600.0  # 增加到 10 分钟
DEFAULT_ON_CHAIN_INTERACT_RETRIES = 50.0   # 增加到 50 次
DEFAULT_ON_CHAIN_INTERACT_SLEEP = 30.0     # 增加到 30 秒  
```

**总等待时间**: 最多 600 秒（10 分钟）

## 修改影响

### 优点
- ✅ 能够应对网络延迟和拥堵情况
- ✅ 给交易确认足够的时间
- ✅ 减少因超时导致的假失败

### 注意事项
- ⚠️ 修改的是虚拟环境中的依赖包代码
- ⚠️ 重新安装或升级 `autonomy` 包会覆盖此修改
- ⚠️ 需要在新环境中重新应用此修改

## 如何恢复

如需恢复原始配置：

```python
# 修改文件：
# ~/Library/Caches/pypoetry/virtualenvs/quickstart-uRKcpSqU-py3.10/lib/python3.10/site-packages/autonomy/chain/tx.py

DEFAULT_ON_CHAIN_INTERACT_TIMEOUT = 60.0
DEFAULT_ON_CHAIN_INTERACT_RETRIES = 5.0
DEFAULT_ON_CHAIN_INTERACT_SLEEP = 3.0
```

## 永久解决方案

为避免升级后丢失配置，建议：

1. **向 Valory 提交 Issue**，建议将这些参数配置化
2. **Fork 仓库**并创建补丁
3. **使用环境变量**控制这些参数（需要代码修改）

## 文件完整路径

```
/Users/andydeng/Library/Caches/pypoetry/virtualenvs/quickstart-uRKcpSqU-py3.10/lib/python3.10/site-packages/autonomy/chain/tx.py
```

---

**修改人**: Andy Deng
**状态**: ✅ 已应用
