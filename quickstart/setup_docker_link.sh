#!/bin/bash

# 修复 Docker socket 链接问题
# 这个脚本需要 sudo 权限

echo "正在创建 Docker socket 符号链接..."
echo "这需要管理员权限，请输入密码："

# 创建符号链接
sudo ln -sf /Users/andydeng/.docker/run/docker.sock /var/run/docker.sock

# 验证链接
if [ -L /var/run/docker.sock ]; then
    echo "✓ 符号链接创建成功！"
    ls -la /var/run/docker.sock
else
    echo "✗ 符号链接创建失败"
    exit 1
fi

echo ""
echo "现在可以运行 Supafund Agent 了："
echo "./run_service.sh configs/config_supafund.json"
