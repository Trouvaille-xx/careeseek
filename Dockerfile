# CareeSeek 前端构建（多阶段）
FROM node:22-alpine AS frontend-build
WORKDIR /app
# npm 用 npmmirror（中国大陆加速）
RUN npm config set registry https://registry.npmmirror.com
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# 后端（含 SQLite 原生模块，用 debian 镜像避免 glibc 问题）
FROM node:22-bookworm-slim AS backend-build
WORKDIR /app
# better-sqlite3 在 node 22 bookworm 上若没匹配预编译会回退 node-gyp 编译，
# 需要 python3 + make + g++；运行时镜像无需这些
# 中国大陆服务器切换为阿里云镜像（默认源在腾讯云上极慢）
RUN sed -i 's|deb.debian.org|mirrors.aliyun.com|g; s|security.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list.d/debian.sources 2>/dev/null \
    || sed -i 's|deb.debian.org|mirrors.aliyun.com|g; s|security.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list 2>/dev/null \
    || true
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
# npm 用 npmmirror（中国大陆加速）
RUN npm config set registry https://registry.npmmirror.com
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
