# 🚀 Supafund Agent 全新启动指南

## 已复制的文件

### 配置文件 ✅
- **configs/config_supafund.json** - Supafund 配置（基于 Trader 配置优化）

### 辅助脚本 ✅
- **start_supafund.sh** - 一键启动脚本
- **change_rpc.sh** - 更换 RPC 工具

### 钱包数据（如果存在）✅
- **.operate/wallets/** - Master 钱包
- **.operate/user.json** - 用户密码

---

## 🎯 快速启动

### 一键启动

```bash
cd /Users/andydeng/Downloads/quickstart-main-2

# 设置 API endpoint（必需）
export SUPAFUND_API_ENDPOINT="your_api_endpoint"

# 启动
./start_supafund.sh
```

### 手动启动

```bash
cd /Users/andydeng/Downloads/quickstart-main-2

# 设置环境变量
export SUPAFUND_API_ENDPOINT="your_api_endpoint"
export SUBGRAPH_API_KEY="your_thegraph_api_key"

# 运行
./run_service.sh configs/config_supafund.json
```

---

## 📋 启动时需要输入

1. **密码** - 首次运行时创建钱包密码（如果已复制钱包则使用原密码）
2. **Staking Program** - 选择 staking 或 "No staking"
3. **SUBGRAPH_API_KEY** - The Graph API key（从 https://thegraph.com/studio/apikeys/ 获取）
4. **PRIORITY_MECH_ADDRESS** - 按回车使用默认值
5. **PRIORITY_MECH_SERVICE_ID** - 按回车使用默认值
6. **SUPAFUND_API_ENDPOINT** - 你的 Supafund API
7. **其他参数** - 按回车使用默认值

---

## 🔧 配置说明

### V2 配置特点

这个配置基于 Trader Agent 的成功模式，关键改进：

1. **使用 "computed" 模式** - 自动适配链上状态
   ```json
   "MECH_CONTRACT_ADDRESS": {"provision_type": "computed"}
   ```

2. **合理的资金分配**
   ```json
   "agent": 0.1 xDAI
   "safe": 5 xDAI
   ```

3. **包含完整的 Subgraph 配置**
   - CONDITIONAL_TOKENS_SUBGRAPH_URL
   - NETWORK_SUBGRAPH_URL
   - OMEN_SUBGRAPH_URL
   - REALITIO_SUBGRAPH_URL
   - TRADES_SUBGRAPH_URL

4. **Trader 验证过的参数**
   - PRIORITY_MECH_ADDRESS
   - PRIORITY_MECH_SERVICE_ID
   - USE_MULTI_BETS_MODE
   - TRADING_STRATEGY

5. **保留 Supafund 特定参数**
   - SUPAFUND_WEIGHTS
   - SUPAFUND_API_ENDPOINT
   - SUPAFUND_MARKET_CREATORS
   - Supafund 创建者地址

---

## ⚙️ 可选：更换 RPC

如果遇到 RPC 超时问题：

```bash
# 使用公共 RPC
./change_rpc.sh https://rpc.gnosischain.com

# 或设置环境变量
export GNOSIS_RPC="https://rpc.gnosischain.com"
```

---

## 📊 检查服务状态

### 查看容器

```bash
# 查看运行中的容器
docker ps

# 应该看到两个容器：
# - trader_abci_0 (Agent)
# - trader_tm_0 (Tendermint)
```

### 查看日志

```bash
# Agent 日志
docker logs $(docker ps -q --filter "name=abci") --follow

# 查找错误
docker logs $(docker ps -q --filter "name=abci") 2>&1 | grep ERROR

# 查找 FSM 状态
docker logs $(docker ps -q --filter "name=abci") 2>&1 | grep "Entered in"
```

### 查看 Safe

```bash
# 获取 Safe 地址
cat .operate/services/sc-*/config.json | grep multisig

# 在浏览器打开
open "https://app.safe.global/home?safe=gno:<safe_address>"
```

---

## 🐛 故障排查

### 问题 1: Docker socket 错误

**错误**: `FileNotFoundError: No such file or directory`

**解决**:
```bash
# 创建符号链接
sudo ln -sf /Users/andydeng/.docker/run/docker.sock /var/run/docker.sock
```

### 问题 2: GS013 错误（旧版本代码）

**这是已知的代码 bug**，会看到：
```
execution reverted: GS013
IntrinsicGas
```

这是因为使用的是旧 hash，包含未修复的代码。
**预期行为** - 暂时无法修复，除非使用修复后的代码。

### 问题 3: 资金不足

**错误**: 提示余额不足

**解决**:
```bash
# 查看 Safe 地址
SAFE=$(cat .operate/services/sc-*/config.json | grep -o '"multisig":"0x[^"]*"' | cut -d'"' -f4)

# 发送至少 5 xDAI
echo "Send xDAI to: $SAFE"
```

### 问题 4: Subgraph API key 无效

**错误**: "payment required"

**解决**: 在 https://thegraph.com/studio/apikeys/ 获取有效 API key

---

## 📁 目录结构

```
/Users/andydeng/Downloads/quickstart-main-2/
├── configs/
│   └── config_supafund.json       ← Supafund 配置
├── .operate/
│   ├── wallets/                   ← 钱包（已复制）
│   ├── user.json                  ← 用户配置（已复制）
│   └── services/                  ← 服务实例（运行时创建）
├── start_supafund.sh              ← 启动脚本
├── change_rpc.sh                  ← RPC 工具
├── run_service.sh                 ← 原始启动脚本
└── stop_service.sh                ← 停止脚本
```

---

## ✅ 验证设置

```bash
cd /Users/andydeng/Downloads/quickstart-main-2

# 检查配置文件
ls -la configs/config_supafund.json

# 检查钱包（可选）
ls -la .operate/wallets/ 2>/dev/null

# 检查脚本
ls -la start_supafund.sh change_rpc.sh
```

---

## 🚀 立即开始

```bash
cd /Users/andydeng/Downloads/quickstart-main-2

# 方法 1: 使用启动脚本
export SUPAFUND_API_ENDPOINT="your_api"
./start_supafund.sh

# 方法 2: 直接运行
./run_service.sh configs/config_supafund.json
```

---

## ⚠️ 重要提醒

1. **使用的是旧版本代码** - 仍会有 GS013 bug
2. **配置已优化** - 使用 Trader 验证过的参数
3. **钱包已复制** - 使用相同的 Master EOA 和 Safe
4. **需要 API key** - The Graph Subgraph API

---

**现在可以测试了！** 🎉

进入新 repo，运行 `./start_supafund.sh`！
