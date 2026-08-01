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

1. **构建镜像**：`docker build -t careeseek .`
2. **配置环境变量**（`server/.env.example` 参考）：
   - `UPSTREAM_BASE_URL` / `UPSTREAM_API_KEY`：托管 LLM 的上游 key
   - `PAY_MODE=mock`：先 mock，有商户号后切 `wechat`
3. **启动**：`docker compose up -d`（含数据卷持久化 SQLite）
4. **Nginx**：`deploy/nginx.conf` 反代 + HTTPS（Let's Encrypt），`proxy_buffering off` 保 SSE
5. **验证**：`https://你的域名/health` → `{"ok":true}`

> 注意：Docker Hub 网络受限时，先配置国内镜像加速（`/etc/docker/daemon.json` 的 `registry-mirrors`）。

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
