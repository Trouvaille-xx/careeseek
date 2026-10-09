import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// 后端地址（开发期代理；生产环境同域部署不需要）
const API_PROXY_TARGET = process.env.VITE_API_PROXY_TARGET || 'http://localhost:3001'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        admin: path.resolve(__dirname, 'admin.html'),
      },
    },
  },
  server: {
    watch: {
      // 编辑器/工具用「临时文件 + 重命名」原子写，会在源码目录留下 .xxx.<pid>.<uuid>.tmpdir/*.tmp。
      // watcher 抓到这些文件会以 EBUSY 抛出未处理的 error 事件，直接让 dev server 进程退出；
      // 而开发期 /v1 是由 vite 代理转发的 —— 进程一崩，正在跑的 AI 请求会被当场掐断。这里全部忽略。
      ignored: ['**/.*.tmpdir/**', '**/*.tmpdir/**', '**/*.tmp', '**/.*.tmp'],
    },
    proxy: {
      // 托管后端（auth/chat/events/payments 全走 /v1）
      '/v1': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
      },
    },
  },
})
