# Supafund Agent 启动故障排查报告

**日期**: 2025-10-23
**问题**: Gnosis 链交易超时导致服务部署失败
**状态**: 待解决（需要技术支持）

---

## 问题概述

在尝试启动 Supafund Agent 时，遇到链上交易超时错误：
```
autonomy.chain.exceptions.ChainTimeoutError: Timed out when waiting for transaction to go through
```

交易哈希: `0x88305db157296f9940c92bd754c741e9240cf65646ad3d45e957b28bbb8581c3`

---

## 已完成的故障排查工作

### 1. Python 环境配置修复 ✅

**问题**: 系统 Python 版本 3.12.2 不符合项目要求（需要 >=3.8.0, <3.12.0）

**解决方案**:
- 检测到 `PYENV_VERSION=3.12.2` 环境变量覆盖了本地配置
- 使用 pyenv 设置项目本地 Python 版本为 3.10.14
- 更新 `.python-version` 文件指定 Python 3.10.14
- 验证 Python 版本兼容性通过

**命令执行**:
```bash
pyenv versions  # 查看可用版本
echo "3.10.14" > .python-version  # 设置本地版本
python --version  # 验证版本
```

**结果**: ✅ Python 环境配置成功，版本兼容性问题已解决

---

### 2. 区块链交易状态核查 ✅

**问题**: 脚本报告交易超时，但不确定交易是否真正失败

**排查方法**:
使用 Gnosis Blockscout API 查询交易状态：
```bash
curl -s "https://gnosis.blockscout.com/api/v2/transactions/0x88305db157296f9940c92bd754c741e9240cf65646ad3d45e957b28bbb8581c3"
```

**关键发现**:
```json
{
  "status": "ok",
  "result": "success",
  "confirmations": 176,
  "block_number": 42757027,
  "gas_used": "117933",
  "method": "execTransaction"
}
```

**结论**: ✅ **交易实际上已经成功上链**，问题在于 RPC 节点响应过慢，导致脚本无法及时获取交易收据

---

### 3. RPC 节点性能测试与优化 ✅

**问题**: Alchemy RPC 节点响应速度慢，导致脚本超时

**测试方法**:
编写脚本测试多个公共 RPC 节点的响应速度：
```bash
# 测试 eth_blockNumber 调用的延迟
curl -s -X POST "$RPC_URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**测试结果**:
| RPC 节点 | 响应时间 | 状态 |
|---------|---------|------|
| Alchemy (当前) | 762ms | ✅ |
| Gnosis 官方 | 652ms | ✅ **最快** |
| PublicNode | 661ms | ✅ |
| dRPC | 681ms | ✅ |
| Ankr | - | ❌ 失败 |

**优化措施**:
1. 创建 RPC 更换脚本 `change_rpc.sh`
2. 切换到 Gnosis 官方 RPC: `https://rpc.gnosischain.com`
3. 备份原配置文件 (`.rpc_backup_1761146404`)
4. 更新两个配置位置:
   - `chain_configs.gnosis.ledger_config.rpc`
   - `env_variables.GNOSIS_LEDGER_RPC.value`

**命令执行**:
```bash
./change_rpc.sh https://rpc.gnosischain.com
```

**结果**: ✅ RPC 节点已优化，响应速度提升 14.4% (762ms → 652ms)

---

### 4. 超时参数源码分析 ✅

**目标**: 找到交易超时和重试参数的配置位置，准备调整以应对网络延迟

**分析文件**:
- `autonomy/chain/tx.py` - 交易处理核心逻辑
- `operate/services/protocol.py` - 服务部署协议实现

**发现的默认配置**:
```python
# autonomy/chain/tx.py (行 40-42)
DEFAULT_ON_CHAIN_INTERACT_TIMEOUT = 60.0  # 超时时间：60秒
DEFAULT_ON_CHAIN_INTERACT_RETRIES = 5.0   # 重试次数：5次
DEFAULT_ON_CHAIN_INTERACT_SLEEP = 3.0     # 重试间隔：3秒
```

**超时逻辑分析**:
```python
# tx.py 行 159-160
deadline = datetime.now().timestamp() + self.timeout
while retries < self.retries and deadline >= datetime.now().timestamp():
```

**实际超时计算**:
- 总超时时间: 60秒
- 重试次数: 5次
- 单次尝试时间: ~12秒/次
- 重试间隔: 3秒

**TxSettler 实例化位置** (protocol.py):
- 行 167: `settle()` 方法 - **未指定超时参数（使用默认）**
- 行 328: 注册服务 - 使用 `ON_CHAIN_INTERACT_*` 常量
- 行 419: 取消质押 - 使用 `ON_CHAIN_INTERACT_*` 常量

**关键发现**:
- 行 167 的 `TxSettler` 实例化**没有传入**自定义超时参数
- 这是导致服务更新操作使用默认 60 秒超时的根本原因
- 其他操作（注册、质押）都正确使用了自定义参数

---

### 5. 环境和服务清理 ✅

**执行操作**:
```bash
# 清理旧容器
docker ps -a --filter "name=trader" -q | xargs -r docker rm -f

# 验证清理结果
docker ps -a --filter "name=trader"
```

**结果**: ✅ 环境清理完成，准备重新部署

---

## 问题根因分析

### 直接原因
- **RPC 节点响应慢** (762ms)
- **交易收据查询超时** (60秒内未获取到收据)
- **脚本抛出超时异常** 但交易已成功

### 深层原因
1. **网络延迟**: Gnosis 链在某些时段网络拥堵
2. **RPC 节点负载**: Alchemy 节点可能承载过多请求
3. **超时配置偏小**: 默认 60 秒可能不足以应对网络波动
4. **代码缺陷**: `protocol.py:167` 的 `TxSettler` 未使用自定义超时参数

### 异常行为
- 交易已在区块 42757027 确认（176+ 确认）
- 但脚本仍报告"Timed out"
- 说明问题在于**收据轮询超时**，而非交易失败

---

## 需要的技术支持

### 1. 修改超时参数 (优先级: 高)

**位置**: `operate/services/protocol.py` 行 167

**当前代码**:
```python
def settle(self) -> t.Dict:
    """Settle the transaction."""
    tx_settler = TxSettler(
        ledger_api=self.ledger_api,
        crypto=self.crypto,
        chain_type=self.chain_type,
    )  # 未传入超时参数
```

**建议修改**:
```python
def settle(self) -> t.Dict:
    """Settle the transaction."""
    tx_settler = TxSettler(
        ledger_api=self.ledger_api,
        crypto=self.crypto,
        chain_type=self.chain_type,
        timeout=180.0,    # 增加到 3 分钟
        retries=10,       # 增加重试次数到 10
        sleep=5.0,        # 增加重试间隔到 5 秒
    )
```

**理由**:
- Gnosis 链平均区块时间 ~5秒
- 网络拥堵时可能需要更长时间获取收据
- 其他 `TxSettler` 实例都使用了自定义参数，唯独这个遗漏

**风险**: 需要修改虚拟环境中的依赖包代码，升级 `operate` 包可能覆盖修改

---

### 2. 配置化超时参数 (优先级: 中)

**建议**: 将超时参数添加到服务配置文件中

**位置**: `.operate/services/sc-*/config.json`

**建议配置结构**:
```json
{
  "chain_configs": {
    "gnosis": {
      "ledger_config": {
        "rpc": "https://rpc.gnosischain.com",
        "timeout": 180.0,
        "retries": 10,
        "sleep": 5.0
      }
    }
  }
}
```

**好处**:
- 可以根据不同链调整参数
- 不需要修改源码
- 升级包不会丢失配置

---

### 3. 增强错误处理 (优先级: 低)

**建议**: 改进超时错误的处理逻辑

**当前行为**: 超时后直接抛出异常，不检查交易是否实际成功

**建议改进**:
```python
# tx.py 行 218
except ChainTimeoutError:
    # 超时后最后尝试一次查询交易状态
    if tx_digest:
        try:
            receipt = ledger_api.api.eth.get_transaction_receipt(tx_digest)
            if receipt:
                return receipt
        except:
            pass
    raise ChainTimeoutError("Timed out when waiting for transaction to go through")
```

---

## 当前服务状态

### 区块链状态
- ✅ Service Safe: `0x2a2a515a94F264B0097ab0EABe328Fa7BFEf9b46`
- ✅ Master Safe 余额: 2 OLAS + 5.2 xDAI
- ✅ 最后交易已确认（区块 42757027）
- ⚠️ 服务状态可能不一致（需要确认）

### 本地环境
- ✅ Python 3.10.14 (已配置)
- ✅ RPC 已优化 (Gnosis 官方节点)
- ✅ Docker 环境已清理
- ⚠️ 服务未运行

---

## 后续建议

### 短期方案
1. **联系 OLAS/Valory 技术支持**，报告此问题
2. 暂时手动修改 `protocol.py:167` 增加超时参数
3. 监控下次部署是否成功

### 中期方案
1. 提交 GitHub Issue 到 `valory-xyz/trader` 仓库
2. 建议官方将超时参数配置化
3. 考虑使用私有 RPC 节点（如 Infura/Alchemy Pro）

### 长期方案
1. 贡献 PR 修复这个问题
2. 添加超时参数到配置文件
3. 改进错误处理逻辑

---

## 附录

### A. 相关文件路径
```
项目根目录: /Users/andydeng/Downloads/quickstart-main-2
配置文件: configs/config_supafund.json
服务配置: .operate/services/sc-a1e55ac2-393e-4b6b-8e35-aef2dbf8263a/
虚拟环境: ~/Library/Caches/pypoetry/virtualenvs/quickstart-uRKcpSqU-py3.10
关键代码:
  - autonomy/chain/tx.py (交易处理)
  - operate/services/protocol.py (服务协议)
```

### B. 错误日志
```
Error getting transaction receipt: Transaction with hash: '0x88305db157296f9940c92bd754c741e9240cf65646ad3d45e957b28bbb8581c3' not found.; Will retry in 3.0...
[重复 5 次]

Traceback (most recent call last):
  File "operate/services/manage.py", line 849
    .settle()
  File "autonomy/chain/tx.py", line 218
    raise ChainTimeoutError("Timed out when waiting for transaction to go through")
autonomy.chain.exceptions.ChainTimeoutError: Timed out when waiting for transaction to go through
```

### C. 可用的 RPC 节点列表
```
✅ https://rpc.gnosischain.com (官方 - 652ms)
✅ https://gnosis-rpc.publicnode.com (PublicNode - 661ms)
✅ https://gnosis.drpc.org (dRPC - 681ms)
✅ https://gnosis-mainnet.g.alchemy.com/v2/k72mJduMTVP0-6rwv2f1m (Alchemy - 762ms)
❌ https://rpc.ankr.com/gnosis (失败)
```

### D. 创建的辅助脚本
- `change_rpc.sh` - RPC 节点切换脚本
- `start_supafund.sh` - Supafund Agent 启动脚本

---

## 总结

经过全面的故障排查，已完成以下工作：
1. ✅ 解决 Python 环境兼容性问题
2. ✅ 确认交易已成功上链
3. ✅ 优化 RPC 节点性能
4. ✅ 分析源码定位问题根因
5. ✅ 清理和准备部署环境

**核心问题**: `operate/services/protocol.py:167` 的 `TxSettler` 实例化时未传入超时参数，导致使用 60 秒的默认超时，在网络延迟情况下不足以获取交易收据。

**需要支持**: 需要修改源码或等待官方修复此问题，建议增加超时配置到 180 秒以应对 Gnosis 链的网络延迟。

---

**报告人**: Andy Deng
**联系方式**: [您的联系方式]
**生成时间**: 2025-10-23
