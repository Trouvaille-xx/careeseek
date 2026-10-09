// CareeSeek 演示数据全流程测试脚本
// 直接调用 OpenCode Go (deepseek-v4-flash)，复用 src/services/prompts.ts 的真实模板与渲染逻辑
import fs from 'node:fs';
import path from 'node:path';

// ---------- 配置 ----------
const HARNESS = 'https://opencode.ai/zen/go/v1';
const MODEL = 'deepseek-v4-flash';
const SESSION = 'careeseek-demo-test-20260907';
const credRaw = fs.readFileSync('C:/Users/Trouvaille/.dsh/.credentials.yaml', 'utf8');
const KEY = (credRaw.match(/OPENCODE_GO_API_KEY:\s*'?([^\s']+)/) || [])[1];
if (!KEY) { console.error('no OPENCODE_GO_API_KEY found'); process.exit(1); }

// ---------- 从 prompts.ts 提取真实模板 ----------
const promptsSrc = fs.readFileSync(
  'D:/Projects/VibeCoding Project/006-CareeSeek/src/services/prompts.ts', 'utf8'
);
const templates = {};
const lineRe = /^  (\w+): '((?:[^'\\]|\\.)*)'/gm;
let m;
while ((m = lineRe.exec(promptsSrc)) !== null) {
  templates[m[1]] = m[2]
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}
console.log('模板 keys:', Object.keys(templates).length);

// ---------- render（与 prompts.ts 相同逻辑）----------
function render(key, vars) {
  let out = templates[key];
  if (out === undefined) return '';
  let guard = 0;
  while (guard++ < 5) {
    const next = out.replace(/\{(\w+)\}/g, (mm, name) => {
      if (Object.prototype.hasOwnProperty.call(vars, name)) return vars[name];
      if (name === key) return mm;
      const inner = templates[name];
      if (inner !== undefined) return inner;
      return mm;
    });
    if (next === out) break;
    out = next;
  }
  return out;
}

// ---------- 各步 prompt 组装（对齐 prompts.ts 的 build* 函数）----------
const styleGuide = {
  default: '在保持真实的前提下，提升专业度和匹配度。',
};
const JD_PARSE_SYSTEM = () => render('jd_parse_system', {});
const buildJDPrompt = (jd) => render('jd_prompt', { jd });
const DIAGNOSIS_SYSTEM = () => render('diagnosis_system', {});
const buildDiagnosisPrompt = (jd, resume, analysis) => render('diagnosis_prompt', { jd, resume, analysis });
const MATCHING_SYSTEM = () => render('matching_system', {});
const buildMatchingPrompt = (jd, resume, analysis, diagnosis) => render('matching_prompt', { jd, resume, analysis, diagnosis });
const QUESTIONS_SYSTEM = () => render('questions_system', {});
const buildQuestionsPrompt = (jd, resume, matching) => render('questions_prompt', { jd, resume, matching });
const OPTIMIZE_SYSTEM = () => render('optimize_system', {});
const buildOptimizationPrompt = (jd, resume, analysis, diagnosis, matching, questions, style) =>
  render('optimize_prompt', { jd, resume, analysis, diagnosis, matching, questions, style: styleGuide[style] || styleGuide.default });
const FINAL_RESUME_SYSTEM = () => render('final_resume_system', {});
const buildFinalResumePrompt = (jd, resume, optimization) => render('final_resume_prompt', { jd, resume, optimization });

// ---------- LLM 调用 ----------
async function callChat(system, user) {
  const res = await fetch(`${HARNESS}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KEY}`,
      'x-opencode-session': SESSION,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 32768,
      stream: false,
    }),
    signal: AbortSignal.timeout(180000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`上游 ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  }
  const content = data.choices?.[0]?.message?.content ?? '';
  if (!content.trim()) {
    throw new Error(`空输出（usage: ${JSON.stringify(data.usage ?? {})}）`);
  }
  return content;
}

function extractJSON(text) {
  // 剥代码块标记
  let t = text.replace(/```(?:json)?/gi, '').trim();
  // 1) 整体尝试
  try { return JSON.parse(t); } catch { /* 继续 */ }
  // 2) 数组优先（匹配表/追问/优化是数组）
  const as = t.indexOf('[');
  const ae = t.lastIndexOf(']');
  if (as >= 0 && ae > as) {
    try { return JSON.parse(t.slice(as, ae + 1)); } catch { /* 继续 */ }
  }
  // 3) 对象
  const os = t.indexOf('{');
  const oe = t.lastIndexOf('}');
  if (os >= 0 && oe > os) {
    try { return JSON.parse(t.slice(os, oe + 1)); } catch { /* 继续 */ }
  }
  throw new Error('JSON 解析失败: ' + t.slice(0, 300));
}

// ---------- 演示数据（与 Excel 一致：人物 A 林晓）----------
const JD = `岗位职责：
1. 负责 AI 对话/智能助手类产品的需求分析、产品规划与版本迭代管理
2. 深入理解大模型（LLM）能力边界，设计创新性 AI 产品功能与交互范式
3. 协调算法、工程、设计、运营等多团队完成产品按时交付
4. 建立并跟踪产品数据指标体系，用数据驱动功能优化与用户体验提升
5. 跟踪大模型行业趋势与竞品动态，输出产品策略与路线图报告

任职要求：
1. 统招本科及以上学历，计算机、人工智能等相关专业优先
2. 5 年以上互联网产品经理经验，其中 2 年以上 AI/智能产品经验
3. 具备优秀的产品设计能力，熟练使用 Figma、Axure、XMind 等工具
4. 具备良好的数据分析能力，熟悉 SQL，掌握 Python 者优先
5. 具备较强的主人翁意识与自驱力，善于跨团队沟通与项目管理

加分项：
- 有大模型产品（对话/Agent/RAG）落地经验
- 有 ToB 企业级 AI 解决方案经验
- 有技术背景，理解机器学习基本原理`;

const RESUME = `个人简介
5 年互联网产品经验，其中 2 年深耕 AI 方向，专注大模型应用对话与智能助手产品。主导过 2 个从 0 到 1 的 AI 产品落地，分别在客服效率和内部知识库场景产生了可量化的业务提升。擅长产品规划、需求抽象、数据驱动迭代与跨团队协同。

工作经历
乐行智能科技（深圳）有限公司 | AI 产品经理 | 2023.04 - 至今
- 负责企业级 AI 客服与智能助手产品线，管理需求池、版本规划与发布节奏
- 设计多轮对话与意图路由策略，与算法团队共建评测集，意图识别准确率由 81% 提升至 92%
- 主导接入大模型（RAG + 会话记忆）改造知识检索链路，问题一次解决率提升 18 个百分点
- 建立产品数据看板（PV/UV、会话数、解决率、转人工率），据此驱动 6 个版本的功能取舍

智联信息科技（北京）有限公司 | 产品经理 | 2020.07 - 2023.03
- 负责 B 端客服工作台产品，覆盖工单、质检、知识库模块，完成约 30 个功能迭代交付
- 深入 40+ 企业客户一线调研，沉淀标准需求清单，输出需求文档累计 60 余份
- 参与搭建产品埋点与数据分析体系，为决策提供数据支撑

教育背景
华南理工大学 | 计算机科学与技术 | 本科 | 2016 - 2020

项目经验
企业智能客服助手（大模型方向）
- 作为产品负责人定义场景边界与 MVP 范围，推动从 0 到 1 上线
- 设计知识库切分、检索排序与答案兜底的多轮交互逻辑，降低无效会话
- 组织 12 家试点客户灰度，依据反馈迭代提示词模板与评测口径
- 上线后客服团队单次会话平均处理时长下降 26%

技能
- 产品设计：Figma、Axure、XMind、ProcessOn
- 数据分析：SQL、Excel、Tableau
- AI 相关：Prompt Engineering、RAG 应用设计、模型效果评测
- 协作：Scrum、Jira、Confluence`;

// ---------- 执行全流程（断点续跑）----------
const OUT = path.join(process.cwd(), 'demo-data/test-output.json');
const results = {};
if (fs.existsSync(OUT)) {
  Object.assign(results, JSON.parse(fs.readFileSync(OUT, 'utf8')));
  console.log('已加载历史结果:', Object.keys(results).join(', '));
}
const save = () => fs.writeFileSync(OUT, JSON.stringify(results, null, 2), 'utf8');
const has = (k) => Object.prototype.hasOwnProperty.call(results, k);

try {
  if (!has('jd')) {
    console.log('== Step 2/3: JD 解析 ==');
    const v = extractJSON(await callChat(JD_PARSE_SYSTEM(), buildJDPrompt(JD)));
    results.jd = v; save();
    console.log('responsibilities:', JSON.stringify(v.responsibilities ?? []).slice(0, 200));
    console.log('topAbilities:', JSON.stringify(v.topAbilities ?? []).slice(0, 200));
  }

  if (!has('diagnosis')) {
    console.log('== Step 3/4: 简历诊断 ==');
    const v = extractJSON(await callChat(DIAGNOSIS_SYSTEM(), buildDiagnosisPrompt(JD, RESUME, JSON.stringify(results.jd))));
    results.diagnosis = v; save();
    console.log('overallScore:', v.overallScore, 'atsScore:', v.atsScore);
  }

  if (!has('matching')) {
    console.log('== Step 4/5: 匹配表 ==');
    const v = extractJSON(await callChat(MATCHING_SYSTEM(), buildMatchingPrompt(JD, RESUME, JSON.stringify(results.jd), JSON.stringify(results.diagnosis))));
    results.matching = v; save();
    console.log('匹配条目数:', Array.isArray(v) ? v.length : '?');
  }

  if (!has('questions')) {
    console.log('== Step 5: 追问问题 ==');
    const v = extractJSON(await callChat(QUESTIONS_SYSTEM(), buildQuestionsPrompt(JD, RESUME, JSON.stringify(results.matching))));
    results.questions = v; save();
    console.log('问题数:', Array.isArray(v) ? v.length : '?', '首问:', JSON.stringify((v[0] ?? {}).question ?? '').slice(0, 80));
  }

  if (!has('optimization')) {
    console.log('== Step 6: 逐段优化 ==');
    const v = extractJSON(await callChat(OPTIMIZE_SYSTEM(), buildOptimizationPrompt(JD, RESUME, JSON.stringify(results.jd), JSON.stringify(results.diagnosis), JSON.stringify(results.matching), JSON.stringify(results.questions), 'default')));
    results.optimization = v; save();
    console.log('优化项数:', Array.isArray(v) ? v.length : '?');
    if (Array.isArray(v) && v[0]) {
      console.log('首项 section:', v[0].section, '| optimized:', (v[0].optimized ?? '').slice(0, 60));
    }
  }

  if (!has('final')) {
    console.log('== Step 7: 终稿 ==');
    const v = extractJSON(await callChat(FINAL_RESUME_SYSTEM(), buildFinalResumePrompt(JD, RESUME, JSON.stringify(results.optimization))));
    results.final = v; save();
    const sections = (v.sections ?? []);
    console.log('sections:', sections.map((s) => s.title).join(' / '));
  }

  console.log('== 全流程完成，结果已存 demo-data/test-output.json ==');
  console.log('完成步骤:', Object.keys(results).join(', '));
} catch (e) {
  console.error('失败:', e.message);
  if (e.stack) console.error(e.stack.split('\n').slice(0, 3).join('\n'));
  process.exit(1);
}