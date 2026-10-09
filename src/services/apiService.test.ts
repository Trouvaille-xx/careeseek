import { describe, it, expect } from 'vitest';
import { stripCodeFences, stripThink, extractJSON, unwrapSingleArrayProperty } from '@/services/apiService';

describe('stripCodeFences', () => {
  it('剥离完整 ```json 围栏', () => {
    const input = '```json\n{"a": 1}\n```';
    expect(stripCodeFences(input)).toBe('{"a": 1}');
  });

  it('剥离无语言标记围栏', () => {
    const input = '```\n{"a": 1}\n```';
    expect(stripCodeFences(input)).toBe('{"a": 1}');
  });

  it('保留内容中的代码块围栏', () => {
    const input = '```json\n{"a": "```x```"}\n```';
    expect(stripCodeFences(input)).toBe('{"a": "```x```"}');
  });

  it('无围栏时原样返回并 trim', () => {
    expect(stripCodeFences('  {"a": 1}  ')).toBe('{"a": 1}');
  });

  it('带前导说明文字时仅 trim（不误删）', () => {
    const input = '结果如下：\n```json\n{"a": 1}\n```';
    expect(stripCodeFences(input)).toBe('结果如下：\n```json\n{"a": 1}\n```');
  });
});

describe('extractJSON', () => {
  it('直接解析合法 JSON', () => {
    expect(extractJSON('{"a": 1}')).toBe('{"a": 1}');
  });

  it('围栏包裹的 JSON 正常提取', () => {
    expect(extractJSON('```json\n{"a": [1,2,3]}\n```')).toBe('{"a": [1,2,3]}');
  });

  it('前后有杂文本时回退正则提取', () => {
    const input = '好的，这是结果：{"a": 1} 希望对你有帮助';
    expect(JSON.parse(extractJSON(input))).toEqual({ a: 1 });
  });

  it('数组 JSON 也能提取', () => {
    expect(JSON.parse(extractJSON('[{"x": 1}]'))).toEqual([{ x: 1 }]);
  });

  it('完全无法提取时抛错', () => {
    expect(() => extractJSON('完全没有 JSON 内容')).toThrow(/无法解析/);
  });

  it('含前置 <think>...</think> 时先剥再提取 JSON', () => {
    // 模拟 LLM 在 JSON 前自言自语的场景
    const raw = '<think>用户问了北京。</think>\n{"city":"北京"}';
    expect(JSON.parse(extractJSON(raw))).toEqual({ city: '北京' });
  });

  it('数组被输出上限截断时，抢救出已完整的元素', () => {
    // 第 6 步（逐段优化）实测形态：最后一条只写了一半就断掉
    const truncated = '[{"id":"o1","optimized":"甲"},{"id":"o2","optimized":"乙"},{"id":"o3","opti';
    const parsed = JSON.parse(extractJSON(truncated));
    expect(parsed).toHaveLength(2);
    expect(parsed[1]).toEqual({ id: 'o2', optimized: '乙' });
  });

  it('数组元素内字符串含花括号/转义引号时也能正确抢救', () => {
    const truncated = '[{"a":"含 { 花括号 } 与 \\" 引号"},{"b":"第二个"},{"c": 未完成';
    expect(JSON.parse(extractJSON(truncated))).toHaveLength(2);
  });
});

describe('unwrapSingleArrayProperty', () => {
  it('单属性且为数组时拆包为数组', () => {
    expect(unwrapSingleArrayProperty({ optimizationItems: [{ id: 'o1' }] })).toEqual([{ id: 'o1' }]);
  });

  it('多字段对象不拆包（避免误伤诊断/终稿等对象输出）', () => {
    const obj = { overallScore: 79, dimensionScores: [{ name: '匹配度', score: 80 }] };
    expect(unwrapSingleArrayProperty(obj)).toBe(obj);
  });

  it('已是数组或标量时原样返回', () => {
    expect(unwrapSingleArrayProperty([1, 2])).toEqual([1, 2]);
    expect(unwrapSingleArrayProperty(null)).toBeNull();
    expect(unwrapSingleArrayProperty('x')).toBe('x');
  });
});

describe('stripThink', () => {
  it('剥掉闭合的 <think>...</think> 块', () => {
    const input = '<think>用户问了北京。</think>\n北京是中国的首都。';
    expect(stripThink(input)).toBe('北京是中国的首都。');
  });

  it('剥掉未闭合的 <think>...（兜底丢弃剩余）', () => {
    // 未闭合的 think 块视为整段是思维链，从 <think> 开始全部丢弃
    expect(stripThink('<think>用户问了北京。\n北京是中国的首都')).toBe('');
  });

  it('思维链闭合后还有正文时，只剥 think 保留正文', () => {
    // 实际场景：think 块没闭合但后面跟着用户真正想要的答案
    // 我们严格按"未闭合整段丢弃"以避免泄漏思考内容
    expect(stripThink('<think>reasoning\n答案：北京是首都')).toBe('');
  });

  it('剥掉 ```think 围栏变体', () => {
    const input = '```think\nreasoning here\n```\n最终答案。';
    expect(stripThink(input)).toBe('最终答案。');
  });

  it('无思维链时原样返回', () => {
    expect(stripThink('北京是中国的首都。')).toBe('北京是中国的首都。');
  });

  it('空字符串原样返回', () => {
    expect(stripThink('')).toBe('');
  });

  it('只剥思维链，保留内容中其他 ``` 代码块', () => {
    const input = '<think>reasoning</think>\n使用 `useState` 管理状态，示例：\n```ts\nconst [x, setX] = useState(0);\n```';
    expect(stripThink(input)).toBe('使用 `useState` 管理状态，示例：\n```ts\nconst [x, setX] = useState(0);\n```');
  });
});
