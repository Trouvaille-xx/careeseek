@echo off
REM 生产模式验证：编译产物 + 静态服务 + mock 上游
set UPSTREAM_BASE_URL=http://localhost:3999/v1
set UPSTREAM_API_KEY=mock-key-123
set PORT=3001
set DIST_DIR=D:\Projects\VibeCoding Project\006-CareeSeek\dist
set DB_PATH=D:\Projects\VibeCoding Project\006-CareeSeek\server\data\careeseek-prod.db
node dist/index.js
