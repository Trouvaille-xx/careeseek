import { describe, it, expect } from 'vitest';
import { stripCodeFences, extractJSON } from '@/services/apiService';

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
});
