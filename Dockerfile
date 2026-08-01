# CareeSeek 前端构建（多阶段）
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# 后端（含 SQLite 原生模块，用 debian 镜像避免 glibc 问题）
FROM node:22-bookworm-slim AS backend-build
WORKDIR /app
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --no-audit --no-fund
COPY server ./server
RUN cd server && npm run build

# 运行镜像
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# 前端静态文件
COPY --from=frontend-build /app/dist /app/dist

# 后端
COPY --from=backend-build /app/server/node_modules ./server/node_modules
COPY --from=backend-build /app/server/dist ./server/dist

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

EXPOSE 3001

# 用 node 直接跑编译产物（勿用 npm start 避免额外进程）
CMD ["node", "server/dist/index.js"]
