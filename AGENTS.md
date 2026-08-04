# AGENTS.md

CareeSeek — 中文 AI 简历工作台。React 18 + TypeScript + Vite + Zustand + Tailwind CSS 3 单页应用（`src/`）+ Node Fastify 后端（`server/`，独立 package）。所有 UI 文案与提示词均为中文。**隐私核心：简历内容永不进服务器，只存浏览器 localStorage。**

## Commands

- `npm run dev` — 前端 dev server（http://localhost:5173，`/v1` 代理到 http://localhost:3001）
- `npm run build` — 前端 typecheck (`tsc -b`) + production build
- `npm run test` — 前端 vitest（`src/**/*.test.ts`，当前覆盖 apiService/exportService）
- `cd server && npm install && npm run build` — 后端编译；`start-mock.bat` 用 mock 上游起后端（无需真实 key）；或设 `UPSTREAM_BASE_URL`/`UPSTREAM_API_KEY` 接真实 DeepSeek
- 无 lint。改前后端代码后分别跑 `npm run build` 验证类型

## Structure

- `src/App.tsx` — 页面路由 + 8 步分析流程编排：步骤 2→5 通过 `analysisStatus` 自动链式触发，6/7/8 按需加载；每步完成状态由 `stepReady` 决定"下一步"是否可用。`currentStep` 约定：-5 登录/注册 / -4 设置 / -3 投递跟踪 / -2 模拟面试 / -1 简历库 / 0 首页（新访客显示 LandingPage，有数据显示 AnalysisHomePage）/ 1-8 分析步骤
- `src/features/landing/LandingPage.tsx` — 产品落地页（未登录且无历史的首页）
- `src/features/auth/AuthPage.tsx` — 登录/注册（邮箱+密码，无邮件验证）
- `src/components/ui/PlansDialog.tsx` — 套餐购买（mock 支付轮询）+ 402 升级引导（UpgradeDialog）
- `src/stores/useAppStore.ts` — 唯一全局状态 (zustand)，persist 到 localStorage (`careeseek-storage`)。**auth slice**：`auth`(token/user/quota) 持久化，`login/register/logout/refreshAuth/checkout/pollPayment/fetchPlans`；`quotaError` 由 apiService 402 写入触发全局升级弹窗。**工作区分区**：业务字段（BUSINESS_KEYS）按工作区归档到 `workspaceData`；`apiSettings`/`sidebarExpanded`/`auth` 全局共享
- `src/services/apiService.ts` — LLM 调用入口。**`resolveEndpoint` 双模式**：已登录（auth.token）→ 走代理 `getProxyBase()/chat/completions`（Bearer 会话 token，默认 deepseek-v4-flash）；未登录 → BYOK 直连（apiSettings.baseUrl+apiKey）。402 → `QuotaExceededError` + 写 `quotaError`
- `src/services/tracker.ts` — 埋点 SDK（批量 10 条/5s、localStorage 离线缓冲 ≤200、静默失败、未登录不上报）
- `src/services/analysisService.ts` — 业务层，所有 AI 功能入口
- `src/services/exportService.ts` — 导出：JSON 直接下载、PDF 用 jspdf 动态导入（CJK 字体从 GitHub 下载嵌入，失败降级 helvetica）
- `src/services/resumeDraftService.ts` — finalResume → builder 草稿转换（模板排版）
- `src/services/prompts.ts` — 全部 LLM 提示词模板（DEFAULTS 21 键，`{占位符}` 定义）+ 渲染函数 `render()`；支持服务端覆盖（见 Gotchas）
- `src/services/promptOverrides.ts` — 提示词服务端覆盖缓存：localStorage + 30 分钟刷新 + 静默失败回退默认；`loadOverridesFromCache()`（启动）+ `loadPromptOverrides()`（登录后）
- `src/features/<step>/` — 每步一个页面；`applications/` 投递跟踪站；`resume-builder/` 简历制作
- `src/admin/` — 管理后台独立 bundle（admin.html 多入口）：`AdminApp.tsx` + `views/{DashboardView,UsersView,PromptsView}`；PromptsView 按功能分组（system+prompt 配对同屏编辑）+ 版本历史/回滚 + **Eva 评审**
- `server/src/` — Fastify 后端：`index.ts`(入口+静态服务) `db.ts`(SQLite schema) `auth.ts`(注册登录+token+ADMIN_EMAILS 提权) `proxy.ts`(LLM 代理 SSE透传+记账) `pricing.ts`(模型单价+峰谷) `plans.ts`(套餐+配额) `routes/`(chat/events/payments/prompts/admin/eva)
- `src/types/index.ts` — 所有共享类型

## Gotchas

- **`src/mock/` 是遗留死代码**：`mockAiService`、`mockInterviewService`、generators 均未被应用引用。仅 `SAMPLE_USER_INPUT` (mock/data.ts) 被 InputPage 使用
- 路径别名 `@/*` → `src/*`（vite.config.ts 与 tsconfig.json 均已配置）
- PDF/DOCX 上传不做客户端文本提取，只把 `[PDF 文件: xxx]` 占位标记传给 LLM 让它提取
- 面试 (MockInterviewPage) 的 learning 模式依赖 LLM 输出 `[TIP]` / `[SCORE]` 标记；`startInterview` 按 `\n\d+[.、]` 分割自我介绍与首个问题
- 大多数步骤要求 LLM 返回严格 JSON，且 90 秒超时；`extractJSON` 剥 `<think>` 思维链（未闭合也剥）+ 尾部 JSON 优先
- 步骤 2 (JD 解析) 是流式（SSE），`jdStreamText` 不持久化（partialize 不含）
- 简历制作 `resumeBuilder` 是独立草稿；builder PDF 走 `exportBuilderPDF`（结构化排版），`exportPDF`（纯文本 sections）现未使用
- **埋点白名单**：events 只允许枚举事件名 + 数字/白名单枚举 props（server/src/routes/events.ts），禁 PII/自由文本
- **支付**：`PAY_MODE=mock`（轮询即付）| `wechat`（需商户号，未接入）；checkout 后前端 3s 轮询 `GET /v1/payments/:id`
- **better-sqlite3 必须 12.11.1**（v13 无 node 22 win32 预编译二进制，会编译失败）
- 后端 `getProxyBase()` 默认同域 `/v1`（生产同域）；开发期 vite proxy 转发到 3001
- 生产模式 Fastify 服务前端 `dist/` 静态文件 + SPA fallback；nginx 需 `proxy_buffering off` 保 SSE
- 运行 app 双通道：未登录 BYOK（设置页填 key）或登录走托管代理；API Key 默认 gpt-4o，代理默认 deepseek-v4-flash
- **管理后台**：`/admin` 独立入口（admin.html + src/admin/），登录校验 `role=admin`（admin token 存 `careeseek-admin-token`，与主应用隔离）；提权靠 `ADMIN_EMAILS`（逗号分隔邮箱，启动时 `promoteAdmins`），改名单后需重建容器
- **提示词服务端覆盖**：`prompts`/`prompt_versions` 表存储覆盖（默认值为空表，前端回退内置 DEFAULTS）；PUT 保存新版本、rollback 按版本回滚；`GET /v1/prompts` 需登录
- **Eva 评审**：`POST /v1/admin/eva/review`（admin 鉴权，服务端直调上游 LLM，模型 `EVA_MODEL` 默认 MiniMax-M3，不记账不耗配额）；评审维度：约束力/JSON 规范性/占位符完整性/指令冲突/冗余
- **部署（docker-compose v1.29.2）**：`deploy/deploy.ps1` 打包（排除 node_modules/dist/.git/pako.min.js）→ scp → `server-deploy.sh` 备份+解压+`docker-compose up -d --build`；`.env.deploy` 存真实上游配置（含 API Key，勿入库），compose environment 需显式声明 `ADMIN_EMAILS: ${ADMIN_EMAILS:-}` 才会传入容器
- **docker-compose v1 陷阱**：`up --force-recreate` 在旧 compose + 新 Docker 上报 `KeyError: 'ContainerConfig'` 并删掉旧容器；正确重建姿势是 `docker rm -f <容器>` + `docker-compose up -d`（数据卷 careeseek-data 保留 SQLite 不丢）
