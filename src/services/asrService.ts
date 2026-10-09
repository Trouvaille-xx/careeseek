import type { AsrMode } from '@/types';
import { getProxyBase } from '@/stores/useAppStore';

/**
 * 语音转文字（ASR）服务。
 * 支持三种模式：
 * - server：上传音频到后端 Whisper（服务器运行 transformers.js，首次需下载模型）
 * - browser：浏览器本地运行 Whisper（transformers.js WASM，模型缓存到 IndexedDB，隐私最佳）
 * - text：用户直接粘贴文字（无 ASR）
 * - aws：预留（一期不开放）
 */

/** 浏览器端 whisper pipeline 单例（懒加载） */
let browserPipelinePromise: Promise<unknown> | null = null;

type WhisperPipeline = (input: unknown, opts?: Record<string, unknown>) => Promise<{ text: string }>;

async function getBrowserPipeline(): Promise<WhisperPipeline> {
  if (!browserPipelinePromise) {
    browserPipelinePromise = (async () => {
      const mod = await import('@huggingface/transformers');
      const pipeline = mod.pipeline as (
        task: string,
        model: string,
        opts?: Record<string, unknown>
      ) => Promise<unknown>;
      return pipeline('automatic-speech-recognition', 'Xenova/whisper-base', {
        dtype: 'fp32',
      }) as Promise<WhisperPipeline>;
    })();
  }
  return browserPipelinePromise as Promise<WhisperPipeline>;
}

/** 将 AudioFile/File 解码为 16kHz mono Float32Array（浏览器 AudioContext） */
async function decodeAudio(file: File | Blob): Promise<Float32Array> {
  const ctx = new AudioContext({ sampleRate: 16000 });
  try {
    const buf = await file.arrayBuffer();
    const audio = await ctx.decodeAudioData(buf);
    // 混音到单声道 + 重采样（decodeAudioData 已按 ctx.sampleRate 解码，但原采样率可能不同）
    const src = audio.getChannelData(0);
    // 如果原采样率不是 16k，重采样
    if (audio.sampleRate === 16000) return new Float32Array(src);
    const ratio = audio.sampleRate / 16000;
    const outLen = Math.floor(src.length / ratio);
    const out = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const pos = i * ratio;
      const idx = Math.floor(pos);
      const frac = pos - idx;
      const a = src[idx] ?? 0;
      const b = src[idx + 1] ?? a;
      out[i] = a + (b - a) * frac;
    }
    return out;
  } finally {
    void ctx.close();
  }
}

export interface TranscribeResult {
  text: string;
  mode: AsrMode;
}

/**
 * 转写音频文件。
 * @param mode 模式：server / browser / text
 * @param file 音频文件（text 模式传 null）
 * @param onProgress 进度回调（下载模型/转写进度百分比）
 */
export async function transcribeAudio(
  mode: AsrMode,
  file: File | null,
  onProgress?: (progress: number) => void
): Promise<TranscribeResult> {
  if (mode === 'text') {
    throw new Error('文本模式不需要转写');
  }
  if (!file) throw new Error('请选择录音文件');

  if (mode === 'browser') {
    onProgress?.(5);
    const pipeline = await getBrowserPipeline();
    onProgress?.(30);
    const pcm = await decodeAudio(file);
    const result = await pipeline(pcm, { language: 'chinese', task: 'transcribe' });
    onProgress?.(100);
    return { text: (result.text ?? '').trim(), mode };
  }

  // server 模式
  onProgress?.(10);
  const { auth } = (await import('@/stores/useAppStore')).useAppStore.getState();
  if (!auth.token) throw new Error('服务器转写需要登录（云端积分模式）');
  const form = new FormData();
  form.append('audio', file);
  const res = await fetch(`${getProxyBase()}/asr/transcribe`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${auth.token}` },
    body: form,
  });
  onProgress?.(70);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `转写失败 (${res.status})`);
  }
  const data = (await res.json()) as { text: string };
  onProgress?.(100);
  return { text: data.text.trim(), mode };
}

/** 浏览器本地 Whisper 是否可用（检测 WebAssembly/IndexedDB） */
export function isBrowserWhisperSupported(): boolean {
  return typeof WebAssembly !== 'undefined' && typeof indexedDB !== 'undefined' && typeof AudioContext !== 'undefined';
}
