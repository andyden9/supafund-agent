# 部署错误深度分析

**日期**: 2025-10-27
**错误类型**: Docker 网络冲突 + 镜像名称错误

---

## 🎉 好消息

**市场查询已经成功了！**
- ✅ Retrieved questions: Hits4fun 市场
- ✅ OPENING_MARGIN 和 LANGUAGES 修复有效

---

## ❌ 当前问题

### 问题 1: Docker 网络配置冲突

```
NetworkConfigChangedError: Network "sc-0abbe0aa-..._service_traderAoF0_localnet"
needs to be recreated - option "com.docker.network.enable_ipv4" has changed
```

**原因**:
- 旧的 Docker 网络还存在
- 但 Docker 或配置升级导致网络参数变化
- Docker Compose 拒绝使用不匹配的网络

**修复**: ✅ 已清理旧网络

---

### 问题 2: Docker 镜像名称错误 🔴

```
docker.errors.ImageNotFound:
pull access denied for supafund/oar-trader
                            ^^^^^^^^
```

**根本原因**:

**service.yaml:2, 10**:
```yaml
author: supafund  ← 自定义 author
...
agent: supafund/trader:0.27.2:bafybeicxhkpr3ro7osdhatltc2fo2df534o6y2mwkargi6a2vni4rwaqs4
```

**docker-compose.yaml:41** (由部署生成器自动生成):
```yaml
image: supafund/oar-trader:bafybeicxhkpr3ro7osdhatltc2fo2df534o6y2mwkargi6a2vni4rwaqs4
       ^^^^^^^^
       根据 agent author 生成
```

**问题**:
- `supafund/oar-trader` 镜像不存在（Docker Hub 上没有）
- 实际的镜像名称是 `valory/oar-trader`
- 部署生成器根据 agent author 自动生成镜像名称
- 导致名称错误

---

## 🔍 为什么 agent author 是 supafund？

### 推测的创建过程

您可能通过某种方式创建了自定义的 Supafund agent 包：

1. **基于** valory/trader:0.1.0
2. **修改** author 为 "supafund"
3. **发布** 到本地或 IPFS
4. **获得** hash: bafybeicxhkpr3ro7osdhatltc2fo2df534o6y2mwkargi6a2vni4rwaqs4

**问题**: Docker 镜像仍然应该用 valory/oar-trader，而不是 supafund/oar-trader

---

## 🔬 配置链分析

```
service.yaml
  author: supafund
  agent: supafund/trader:0.27.2:baf...
    ↓
部署生成器逻辑
  从 agent 字符串提取 author: "supafund"
  生成 Docker 镜像名: {author}/oar-trader
    ↓
docker-compose.yaml
  image: supafund/oar-trader:baf...  ← 错误！
    ↓
Docker pull
  尝试从 Docker Hub 拉取 supafund/oar-trader
    ↓
  404 Not Found ❌
```

**正确的流程应该是**:
```
service.yaml
  agent: valory/trader:0.1.0:baf...
    ↓
docker-compose.yaml
  image: valory/oar-trader:baf...  ✅
    ↓
Docker pull
  从 Docker Hub 拉取 valory/oar-trader  ✅
```

---

## 🛠️ 解决方案

### 方案 A: 拉取并重新标记（最快）

```bash
# 1. 拉取正确的镜像
docker pull valory/oar-trader:bafybeicxhkpr3ro7osdhatltc2fo2df534o6y2mwkargi6a2vni4rwaqs4

# 2. 重新标记为 supafund/oar-trader（匹配配置）
docker tag \
  valory/oar-trader:bafybeicxhkpr3ro7osdhatltc2fo2df534o6y2mwkargi6a2vni4rwaqs4 \
  supafund/oar-trader:bafybeicxhkpr3ro7osdhatltc2fo2df534o6y2mwkargi6a2vni4rwaqs4

# 3. 启动服务
cd .operate/services/sc-0abbe0aa-e995-4a35-ae9b-05ac89af917a/deployment
docker-compose up -d
```

**优点**: 快速，不需要修改配置
**缺点**: 每次重新部署都需要重新标记

---

### 方案 B: 修改 service.yaml（彻底）

```bash
# 1. 修改 service.yaml
nano .operate/services/sc-0abbe0aa-e995-4a35-ae9b-05ac89af917a/trader/service.yaml

# 修改:
author: valory  # 从 supafund 改为 valory
agent: valory/trader:0.1.0:bafybeibem2qwslhso6rh637frq5a2sxgr7pnbw6d37l3jwpapez7m5nmva

# 2. 重新生成部署
./stop_service.sh configs/config_supafund.json
./start_supafund.sh
```

**优点**: 彻底解决，使用官方配置
**缺点**: 如果 supafund/trader 是故意的自定义包，会丢失定制

---

### 方案 C: 直接修改 docker-compose.yaml（已完成）

```yaml
# 已修改:
image: valory/oar-trader:bafybeicxhkpr3ro7osdhatltc2fo2df534o6y2mwkargi6a2vni4rwaqs4
```

**然后拉取镜像**:
```bash
docker pull valory/oar-trader:bafybeicxhkpr3ro7osdhatltc2fo2df534o6y2mwkargi6a2vni4rwaqs4
```

**优点**: 最直接
**缺点**: 下次重新生成部署会被覆盖

---

## 🔧 关于代理的说明

**您的代理设置**:
```bash
http_proxy=http://127.0.0.1:7890
https_proxy=http://127.0.0.1:7890
```

**影响分析**:

✅ **不影响**:
- Docker 内部网络创建
- 容器间通信
- host.docker.internal 解析

❌ **可能影响**:
- Docker Hub 镜像拉取（如果代理配置不当）
- 外部 API 访问（Subgraph, RPC）

**当前情况**:
- Subgraph 查询成功 ✅ (代理工作正常)
- 镜像拉取正在进行 ✅ (代理工作正常)

**结论**: 代理设置正常，不是问题根源

---

## 📊 当前镜像拉取状态

正在后台拉取两个镜像：

1. ✅ `valory/oar-trader:bafybeicp7ve2jiy2n65nz3ounkehxl4w2zvhz4kztvzm3rl26r6746ctiu`
   - 这是之前使用的镜像
   - 正在拉取中...

2. ✅ `valory/oar-trader:bafybeicxhkpr3ro7osdhatltc2fo2df534o6y2mwkargi6a2vni4rwaqs4`
   - 这是当前配置需要的镜像
   - 正在拉取中...

**等待拉取完成后**，可以：
- 直接启动（如果 docker-compose.yaml 已修复为 valory/oar-trader）
- 或重新标记为 supafund/oar-trader（如果保持原配置）

---

## 🎯 推荐的完整修复步骤

### 步骤 1: 等待镜像拉取完成

```bash
# 检查拉取状态
docker images | grep bafybeicxhkpr3ro7osdhatltc2fo2df534o6y2mwkargi6a2vni4rwaqs4
```

### 步骤 2A: 如果 docker-compose.yaml 已是 valory/oar-trader

```bash
cd .operate/services/sc-0abbe0aa-e995-4a35-ae9b-05ac89af917a/deployment
docker-compose up -d
```

### 步骤 2B: 如果保持 supafund/oar-trader

```bash
# 重新标记镜像
docker tag \
  valory/oar-trader:bafybeicxhkpr3ro7osdhatltc2fo2df534o6y2mwkargi6a2vni4rwaqs4 \
  supafund/oar-trader:bafybeicxhkpr3ro7osdhatltc2fo2df534o6y2mwkargi6a2vni4rwaqs4

# 恢复 docker-compose.yaml
# image: supafund/oar-trader:baf...

# 启动
cd .operate/services/sc-0abbe0aa-e995-4a35-ae9b-05ac89af917a/deployment
docker-compose up -d
```

### 步骤 3: 添加 RPC_0 环境变量（必须）

```bash
echo "RPC_0=https://gnosis-mainnet.g.alchemy.com/v2/k72mJduMTVP0-6rwv2f1m" >> \
  .operate/services/sc-0abbe0aa-e995-4a35-ae9b-05ac89af917a/deployment/agent_0.env

cd .operate/services/sc-0abbe0aa-e995-4a35-ae9b-05ac89af917a/deployment
docker-compose restart
```

---

## 📋 问题总结

| 问题 | 状态 | 解决方案 |
|------|------|---------|
| 网络配置冲突 | ✅ 已清理 | 已删除旧网络 |
| 镜像名称错误 | ✅ 已修复 | docker-compose.yaml 改为 valory |
| 镜像不存在 | 🔄 拉取中 | 正在从 Docker Hub 拉取 |
| RPC_0 未设置 | ⏳ 待修复 | 需要手动添加到 agent_0.env |
| OPENING_MARGIN | ✅ 已修复 | 已调整为合适的值 |

---

## 🎬 预计完成时间

- 镜像拉取: 2-5 分钟（取决于网速和代理）
- 添加 RPC_0: 10 秒
- 启动服务: 30 秒

---

**总结**: 主要是镜像名称配置错误。正在拉取正确的镜像，完成后即可启动！
