# CareeSeek — AI 简历工作台

面向中文求职者的 AI 简历工作台：一份基础简历 → 对标每一份目标 JD 的 8 步定向分析（JD 解析、匹配诊断、逐条优化、最终简历、面试模拟）→ 投递跟踪 → 多模板 PDF 导出。

**隐私优先**：简历内容只保存在浏览器本地（localStorage），永不进入服务器。云端仅托管 LLM 代理（用量/埋点/配额），不记录任何简历内容。

## 架构

```
┌────────────────────┐        ┌──────────────────────┐
│  React SPA (Vite)   │  /v1  │  Fastify 后端 (Node)  │
│  src/               │ ─────►│  server/              │
│  - 8步分析链        │        │  - LLM 代理(SSE透传)  │
│  - 简历库/制作器    │        │  - 用量记账/配额熔断   │
│  - 投递跟踪/面试    │        │  - 邮箱注册登录        │
│  - 登录/套餐/埋点   │        │  - 埋点接收(白名单)    │
│                     │        │  - 支付(mock/微信)    │
│  localStorage 数据  │        │  SQLite 单文件         │
└────────────────────┘        └──────────────────────┘
```

**数据边界**：
- 简历/JD/分析产物/面试记录 → **浏览器 localStorage**（永不传服务器）
- 云端仅存 → 账号、套餐配额、LLM 用量（token 数/成本，无内容）、埋点事件（枚举名+数字，禁 PII）

## 两种模式

| 模式 | 说明 |
|---|---|
| **BYOK 直连** | 未登录，设置页填自己的 API Key（OpenAI 兼容），请求直连 LLM 提供商 |
| **托管代理** | 登录后自动切换，走服务端代理（deepseek-v4-flash），按套餐配额计费 |

## 本地开发

```bash
# 前端
npm install
npm run dev            # http://localhost:5173（/v1 代理到 3001）

# 后端（联调用 mock 上游，无需真实 key）
cd server
npm install
start-mock.bat         # 或: $env:UPSTREAM_BASE_URL='https://api.deepseek.com/v1'; $env:UPSTREAM_API_KEY='sk-xxx'; npx tsx src/index.ts
```

测试：`npm run test`（前端）· `npm run build`（前端 typecheck+build）· `cd server && npm run build`（后端）

## 生产部署（腾讯云轻量）

服务器：`<YOUR_SERVER_IP>`（SSH 用户 `ubuntu`，key `~/.ssh/your_deploy_key`），项目目录 `/opt/careeseek`（非 git 仓库，源码由本地打包上传）。

**首次/更换机器时配置：**

1. **放源码**：把本项目打包传到 `/opt/careeseek`（`deploy/deploy.ps1` 会自动做）
2. **配置上游环境**（服务器上创建 `/opt/careeseek/.env.deploy`，权限 600，会被部署脚本自动读取）：
   ```bash
   UPSTREAM_BASE_URL=https://api.minimax.chat/v1
   UPSTREAM_API_KEY=sk-xxx          # 托管 LLM 上游 key
   PAY_MODE=mock                    # 先 mock，有商户号后切 wechat
   ```

**日常发版（Windows 本地一键）：**

```powershell
powershell -ExecutionPolicy Bypass -File deploy\deploy.ps1
```

脚本做的事：打包源码（排除 node_modules/dist/.git）→ 上传服务器 → 备份旧源码到 `/opt/careeseek.backup-时间戳` → 清理旧容器（**数据卷 `careeseek-data` 保留，SQLite 不丢**）→ `docker-compose up -d --build`。

**手动步骤（等价命令）：**

```bash
# 本机打包上传
tar -czf careeseek_deploy.tgz --exclude=node_modules --exclude=dist --exclude=.git --exclude=pako.min.js .
scp -i ~/.ssh/your_deploy_key careeseek_deploy.tgz ubuntu@<YOUR_SERVER_IP>:/tmp/

# 服务器上
cd /opt/careeseek && tar -xzf /tmp/careeseek_deploy.tgz
docker rm -f careeseek careeseek_careeseek_1 2>/dev/null   # 释放 3001 端口
docker-compose up -d --build
```

**注意事项：**

- 服务器装的是 **docker-compose v1（1.29.2）**，必须用 `docker-compose`（带横杠），不支持 `docker compose` 子命令
- 服务器上不要删除 `careeseek-data` 数据卷（存账号/配额/用量）
- 若镜像构建用旧缓存导致看不到新代码，加 `--no-cache` 重建
- Nginx：`deploy/nginx.conf` 反代 + HTTPS（Let's Encrypt），`proxy_buffering off` 保 SSE
- 验证：`curl http://<YOUR_SERVER_IP>:3001/health` → `{"ok":true}`
- Docker Hub 网络受限时，先配置国内镜像加速（`/etc/docker/daemon.json` 的 `registry-mirrors`）

## 规格文档

- `PRODUCT-DESIGN.md` — 产品/商业模式设计（Open-Core 定价、隐私边界）
- `docs/specs/01-backend-proxy.md` — 后端骨架 + LLM 代理
- `docs/specs/02-auth-account.md` — 邮箱账号体系
- `docs/specs/03-analytics-tracking.md` — 埋点设计（仅过程不记内容）
- `docs/specs/04-plans-payment.md` — 套餐与支付

## 测试

- 前端：`npm run test`（vitest，16 用例：apiService JSON 解析 / exportService）
- 后端：端到端已用 mock 上游验证（注册/登录/LLM 代理/记账/配额 402/埋点/支付升级）
- 生产模式：编译产物 + 静态服务 + SPA fallback 已验证
