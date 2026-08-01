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
  server: {
    proxy: {
      // 托管后端（auth/chat/events/payments 全走 /v1）
      '/v1': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
      },
    },
  },
})
