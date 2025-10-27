# 部署问题修复指南

**更新时间**: 2025-10-23

## 问题总结

启动 Supafund Agent 时遇到 `/data/` 和 `/benchmarks/` 目录权限问题，导致容器无法启动。

---

## ✅ 已完成的永久修复

### 1. 修改了 Docker Compose 模板

**文件**: `autonomy/deploy/generators/docker_compose/templates.py`

在 `ABCI_NODE_TEMPLATE` 中添加了两个卷挂载：
```python
volumes:
  - ./persistent_data/logs:/logs:Z
  - ./agent_keys/agent_{node_id}:/agent_key:Z
  - ./persistent_data/data:/data:Z         # ✅ 新增
  - ./persistent_data/benchmarks:/benchmarks:Z  # ✅ 新增
```

**效果**: 以后每次生成 docker-compose.yaml 都会自动包含这些卷挂载。

### 2. 创建了自动修复脚本

**文件**: `fix_deployment_dirs.sh`

功能：
- 自动找到服务部署目录
- 创建必要的目录（data, benchmarks, logs 等）
- 设置正确的权限（777 确保 Docker 可写）

### 3. 修改了超时配置

**文件**: `autonomy/chain/tx.py`

将交易超时参数增加 10 倍：
- `DEFAULT_ON_CHAIN_INTERACT_TIMEOUT`: 60s → 600s (10 分钟)
- `DEFAULT_ON_CHAIN_INTERACT_RETRIES`: 5 → 50 次
- `DEFAULT_ON_CHAIN_INTERACT_SLEEP`: 3s → 30s

### 4. 修复了 Docker 镜像问题

重新标记了本地镜像以匹配配置要求：
```bash
docker tag \
  valory/oar-trader:bafybeidy5kl7xpkd2pm6szjyvfyfrwoy6bivqwxhgjkcwaghba5dj5q6aq \
  valory/oar-trader:bafybeibem2qwslhso6rh637frq5a2sxgr7pnbw6d37l3jwpapez7m5nmva
```

---

## 🚀 启动服务

现在直接运行：

```bash
./start_supafund.sh
```

启动脚本已集成自动修复功能，会在服务部署后自动：
1. 创建必要的目录
2. 设置正确的权限
3. 重启容器应用修复

---

## 🔧 如果仍然失败

### 手动修复步骤

1. **运行修复脚本**：
   ```bash
   ./fix_deployment_dirs.sh
   ```

2. **查找部署目录**：
   ```bash
   SERVICE_DIR=$(find .operate/services -name "deployment" -type d 2>/dev/null | head -1)
   echo $SERVICE_DIR
   ```

3. **检查 docker-compose.yaml**：
   ```bash
   cat $SERVICE_DIR/docker-compose.yaml
   ```

   确认包含以下卷挂载：
   ```yaml
   volumes:
     - ./persistent_data/logs:/logs:Z
     - ./agent_keys/agent_0:/agent_key:Z
     - ./persistent_data/data:/data:Z         # 必须有
     - ./persistent_data/benchmarks:/benchmarks:Z  # 必须有
   ```

4. **如果卷挂载缺失，手动添加**：
   ```bash
   cd $SERVICE_DIR

   # 备份
   cp docker-compose.yaml docker-compose.yaml.bak

   # 编辑 docker-compose.yaml，在 volumes 部分添加：
   #   - ./persistent_data/data:/data:Z
   #   - ./persistent_data/benchmarks:/benchmarks:Z
   ```

5. **创建目录**：
   ```bash
   mkdir -p persistent_data/data persistent_data/benchmarks
   chmod -R 777 persistent_data/data persistent_data/benchmarks
   ```

6. **重启容器**：
   ```bash
   docker-compose down
   docker-compose up -d
   ```

7. **检查状态**：
   ```bash
   docker ps --filter "name=trader"
   ```

---

## 📊 监控服务

### 查看容器状态
```bash
docker ps --filter "name=trader" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

应该看到两个容器都是 `healthy` 状态：
```
NAMES               STATUS                    PORTS
trader*_tm_0       Up X minutes (healthy)    26656-26657/tcp
trader*_abci_0     Up X minutes (healthy)    0.0.0.0:8716->8716/tcp
```

### 查看日志

**ABCI 容器**（主要逻辑）：
```bash
docker logs $(docker ps -q --filter "name=abci") --follow
```

**Tendermint 容器**（区块链共识）：
```bash
docker logs $(docker ps -q --filter "name=tm_") --follow
```

### 正常运行的日志特征

✅ **好的日志**：
```
[INFO] Entered in the 'update_bets_round' round for period X
[INFO] Retrieved questions: [...]
[INFO] Updated bets: [...]
```

❌ **错误日志**：
```
[ERROR] The store path '/data/' is not a directory or is not writable
[ERROR] Permission denied: '/benchmarks'
[ERROR] Could not synchronize with Tendermint
```

---

## 🐛 常见问题

### Q1: 容器一直 "health: starting"

**可能原因**: Tendermint 正在初始化

**解决方案**: 等待 1-2 分钟，或检查 Tendermint 日志

### Q2: ABCI 容器 "Exited (1)"

**可能原因**: /data/ 或 /benchmarks/ 目录权限问题

**解决方案**: 运行 `./fix_deployment_dirs.sh` 并重启

### Q3: "manifest not found" 错误

**可能原因**: Docker 镜像不存在

**解决方案**:
```bash
docker tag \
  valory/oar-trader:bafybeidy5kl7xpkd2pm6szjyvfyfrwoy6bivqwxhgjkcwaghba5dj5q6aq \
  valory/oar-trader:bafybeibem2qwslhso6rh637frq5a2sxgr7pnbw6d37l3jwpapez7m5nmva
```

### Q4: "ChainTimeoutError"

**可能原因**: RPC 节点响应慢或网络延迟

**解决方案**:
- 已增加超时到 600 秒，应该能解决
- 如果仍然超时，更换 RPC: `./change_rpc.sh https://rpc.gnosischain.com`

---

## 📝 修改记录

| 日期 | 修改内容 | 状态 |
|------|---------|------|
| 2025-10-23 | 修复 /data/ 和 /benchmarks/ 卷挂载 | ✅ |
| 2025-10-23 | 增加交易超时到 600 秒 | ✅ |
| 2025-10-23 | 修复 Docker 镜像标签 | ✅ |
| 2025-10-23 | 优化 RPC 节点（Gnosis 官方） | ✅ |
| 2025-10-23 | 创建自动修复脚本 | ✅ |

---

## 🆘 获取帮助

如果问题仍然无法解决：

1. **收集信息**：
   ```bash
   echo "=== 容器状态 ===" > debug.log
   docker ps -a --filter "name=trader" >> debug.log

   echo -e "\n=== ABCI 日志 ===" >> debug.log
   docker logs $(docker ps -aq --filter "name=abci") --tail 100 >> debug.log

   echo -e "\n=== Tendermint 日志 ===" >> debug.log
   docker logs $(docker ps -aq --filter "name=tm_") --tail 100 >> debug.log

   echo -e "\n=== Docker Compose ===" >> debug.log
   find .operate/services -name "docker-compose.yaml" -exec cat {} \; >> debug.log
   ```

2. **查看 debug.log** 并分享给技术支持

3. **联系支持**：
   - GitHub Issues: https://github.com/valory-xyz/trader/issues
   - Discord: OLAS/Valory 社区

---

**生成时间**: 2025-10-23
**维护**: Andy Deng
