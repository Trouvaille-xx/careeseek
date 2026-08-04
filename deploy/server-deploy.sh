#!/bin/bash
# 服务端部署脚本（运行在服务器上，由 deploy/deploy.ps1 推送后在服务器执行）
# 前提：源码 tar 已上传到 /tmp/careeseek_deploy.tgz
set -euo pipefail

DEPLOY_DIR=/opt/careeseek
TARBALL=/tmp/careeseek_deploy.tgz
DATE=$(date '+%Y%m%d-%H%M%S')

[ -f "$TARBALL" ] || { echo "错误：缺少 $TARBALL" >&2; exit 1; }

echo "[1/5] 备份旧源码到 ~/backups/careeseek-$DATE"
BACKUP_DIR=$HOME/backups/careeseek-$DATE
mkdir -p "$BACKUP_DIR"
if [ -d "$DEPLOY_DIR" ]; then
  cp -a "$DEPLOY_DIR" "$BACKUP_DIR/source"
fi

echo "[2/5] 解压新源码"
cd "$DEPLOY_DIR"
tar -xzf "$TARBALL"
rm -f pako.min.js
rm -rf node_modules dist server/node_modules

echo "[3/5] 读取上游配置 .env.deploy（含 API Key，勿入库）"
if [ ! -f "$DEPLOY_DIR/.env.deploy" ]; then
  echo "错误：$DEPLOY_DIR/.env.deploy 不存在，请先创建（见 README 生产部署节）" >&2
  exit 1
fi
set -a; source "$DEPLOY_DIR/.env.deploy"; set +a

echo "[4/5] 清理旧容器（保留数据卷，SQLite 不丢）"
docker rm -f careeseek careeseek_careeseek_1 >/dev/null 2>&1 || true

echo "[5/5] 构建镜像并启动"
cd "$DEPLOY_DIR"
docker-compose up -d --build
docker ps --filter name=careeseek

echo "完成。健康检查：curl http://127.0.0.1:3001/health"