import type { FastifyInstance } from 'fastify';
import { getUserByToken } from '../auth.js';

/**
 * 语音转文字（ASR）——服务器端 Whisper。
 * - POST /v1/asr/transcribe  上传音频文件 → 返回转写文本
 *
 * 模型：Whisper base（约 150MB），首次调用时从 HuggingFace 自动下载缓存到
 * HF_HOME（默认 ~/.cache/huggingface）。之后复用内存中的 pipeline。
 *
 * 隐私说明：音频只在本服务器处理，转写完成后不保留音频文件。
 */

let pipelinePromise: Promise<unknown> | null = null;

/** 懒加载 Whisper pipeline（transformers.js；Node 下自动选 onnxruntime-node 原生后端） */
async function getWhisperPipeline(): Promise<unknown> {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const { pipeline } = await import('@huggingface/transformers');
      return pipeline('automatic-speech-recognition', 'Xenova/whisper-base', {
        dtype: 'fp32',
      });
    })();
  }
  return pipelinePromise;
}

export function attachAsrRoutes(app: FastifyInstance): void {
  app.post('/v1/asr/transcribe', async (req, reply) => {
    const user = getUserByToken(app.db, req);
    if (!user) return reply.status(401).send({ error: '未登录' });

    // 需要 multipart 上传 —— Fastify 需注册 multipart 插件
    const data = await req.file().catch(() => null);
    if (!data) return reply.status(400).send({ error: '请上传音频文件（multipart 表单，字段名 audio）' });

    try {
      const whisp = (await getWhisperPipeline()) as {
        (input: unknown, opts?: Record<string, unknown>): Promise<{ text: string }>;
      };
      // 将上传的 Buffer 转为 Float32Array（whisper 需要 16k 采样率 PCM）
      const buffer = await data.toBuffer();
      const audio = await decodeAudioToPcm16k(buffer, data.mimetype);
      if (!audio || audio.length === 0) {
        return reply.status(400).send({ error: '无法解码音频，请上传 wav/mp3/ogg/m4a 格式' });
      }
      const result = await whisp(audio, { language: 'chinese', task: 'transcribe' });
      return reply.send({ text: (result.text ?? '').trim() });
    } catch (e) {
      app.log.error(`[asr] 转写失败: ${(e as Error).message}`);
      return reply.status(500).send({ error: `语音转写失败：${(e as Error).message}` });
    }
  });
}

/**
 * 把任意音频 Buffer 解码为 16kHz 单声道 Float32Array（whisper 输入格式）。
 * 使用 @huggingface/transformers 自带解码能力或简单 WAV 解析。
 * 这里先用 WAV 解析 + 提示；mp3/ogg 需要 ffmpeg 或解码器，若缺失则报错提示。
 */
async function decodeAudioToPcm16k(
  buffer: Buffer,
  mimetype: string
): Promise<Float32Array | null> {
  // 仅支持 WAV（PCM）现在；mp3/ogg 交给 ffmpeg（有则用）
  if (mimetype.includes('wav') || buffer.subarray(0, 4).toString('ascii') === 'RIFF') {
    return decodeWav(buffer);
  }
  // 尝试用系统 ffmpeg（若安装）解码为 wav 再解析
  const decoded = await decodeViaFfmpeg(buffer, mimetype);
  if (decoded) return decoded;
  throw new Error('仅支持 WAV 格式；MP3/OGG 需要服务器安装 ffmpeg，或改用文本粘贴/浏览器模式');
}

function decodeWav(buffer: Buffer): Float32Array | null {
  if (buffer.subarray(0, 4).toString('ascii') !== 'RIFF') return null;
  let offset = 12; // skip RIFF....WAVE
  let channels = 1;
  let sampleRate = 16000;
  let bitsPerSample = 16;
  let dataOffset = 0;
  let dataSize = 0;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.subarray(offset, offset + 4).toString('ascii');
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;
    if (chunkId === 'fmt ') {
      channels = buffer.readUInt16LE(chunkStart + 2);
      sampleRate = buffer.readUInt32LE(chunkStart + 4);
      bitsPerSample = buffer.readUInt16LE(chunkStart + 14);
    } else if (chunkId === 'data') {
      dataOffset = chunkStart;
      dataSize = chunkSize;
      break;
    }
    offset = chunkStart + chunkSize + (chunkSize % 2);
  }
  if (!dataOffset) return null;

  // 16-bit PCM → Float32
  const samples: number[] = [];
  if (bitsPerSample === 16) {
    for (let i = dataOffset; i < dataOffset + dataSize - 1; i += 2) {
      const s = buffer.readInt16LE(i);
      samples.push(s / 32768);
    }
  } else if (bitsPerSample === 8) {
    for (let i = dataOffset; i < dataOffset + dataSize; i++) {
      samples.push((buffer[i] - 128) / 128);
    }
  } else {
    return null;
  }

  // 降采样/混音到 16k mono
  const mono = mixToMono(samples, channels);
  return resample(mono, sampleRate, 16000);
}

/** 多声道混音为单声道 */
function mixToMono(samples: number[], channels: number): number[] {
  if (channels <= 1) return samples;
  const out: number[] = [];
  for (let i = 0; i + channels - 1 < samples.length; i += channels) {
    let sum = 0;
    for (let c = 0; c < channels; c++) sum += samples[i + c];
    out.push(sum / channels);
  }
  return out;
}

/** 线性重采样到目标采样率 */
function resample(samples: number[], fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return Float32Array.from(samples);
  const ratio = fromRate / toRate;
  const outLen = Math.floor(samples.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const a = samples[idx] ?? 0;
    const b = samples[idx + 1] ?? a;
    out[i] = a + (b - a) * frac;
  }
  return out;
}

/** 若系统装了 ffmpeg，用它把非 wav 转成 16k 单声道 wav 再解析 */
async function decodeViaFfmpeg(buffer: Buffer, _mimetype: string): Promise<Float32Array | null> {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execFileAsync = promisify(execFile);
  const { tmpdir } = await import('node:os');
  const fs = await import('node:fs');
  const path = await import('node:path');

  const tmpIn = path.join(tmpdir(), `careeseek-asr-${Date.now()}.in`);
  const tmpOut = path.join(tmpdir(), `careeseek-asr-${Date.now()}.wav`);
  try {
    fs.writeFileSync(tmpIn, buffer);
    await execFileAsync('ffmpeg', ['-y', '-i', tmpIn, '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', tmpOut]);
    const wav = fs.readFileSync(tmpOut);
    return decodeWav(wav);
  } catch {
    return null;
  } finally {
    try { fs.unlinkSync(tmpIn); } catch { /* ignore */ }
    try { fs.unlinkSync(tmpOut); } catch { /* ignore */ }
  }
}
