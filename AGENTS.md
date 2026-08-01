# AGENTS.md

CareeSeek — 中文 AI 简历优化 Web 应用。React 18 + TypeScript + Vite + Zustand + Tailwind CSS 3 单页应用。所有 UI 文案与提示词均为中文。

## Commands

- `npm run dev` — dev server
- `npm run build` — typecheck (`tsc -b`) + production build；这是唯一的验证方式
- 无 lint、无测试框架、无格式化配置。改代码后跑 `npm run build` 验证类型

## Structure

- `src/App.tsx` — 8 步分析流程编排：步骤 2→5 通过 `analysisStatus` 自动链式触发，6/7/8 按需加载；每步完成状态由 `stepReady` 决定"下一步"是否可用
- `src/stores/useAppStore.ts` — 唯一的全局状态 (zustand)，persist 到 localStorage (`careeseek-storage`)。API 配置 (baseUrl/apiKey/model) 存于此，未配置 key 时 `callLLM` 直接抛错
- `src/services/analysisService.ts` — 业务层，所有 AI 功能入口
- `src/services/apiService.ts` — OpenAI 兼容 `/chat/completions` 调用；`callLLMWithJSON` 会剥掉 markdown 代码块并回退到正则提取 JSON
- `src/services/prompts.ts` — 全部 LLM 系统提示词与 prompt 构建函数
- `src/features/<step>/` — 每步一个页面；`src/components/ui/` 共享 UI 组件
- `src/types/index.ts` — 所有共享类型（LLM 输出的类型定义在此，改 prompt 产出结构时同步改这里）

## Gotchas

- **`src/mock/` 是遗留死代码**：`mockAiService`、`mockInterviewService`、generators 均未被应用引用，不要用它做开发/验证。仅 `SAMPLE_USER_INPUT` (mock/data.ts) 被 InputPage 的"示例"功能使用
- 路径别名 `@/*` → `src/*`（vite.config.ts 与 tsconfig.json 均已配置）
- PDF/DOCX 上传不做客户端文本提取，只把 `[PDF 文件: xxx]` 占位标记传给 LLM 让它提取
- 面试 (MockInterviewPage) 的 learning 模式依赖 LLM 输出 `[TIP]` / `[SCORE]` 标记；`startInterview` 按 `\n\d+[.、]` 分割自我介绍与首个问题
- 修改 `analysisService` 的 prompt 后注意：大多数步骤要求 LLM 返回严格 JSON，且 90 秒超时（`fetchWithTimeout`）
- 运行 app 需在设置弹窗中配置 API Key（默认 gpt-4o），无后端、无环境变量
