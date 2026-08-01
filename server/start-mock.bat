@echo off
set UPSTREAM_BASE_URL=http://localhost:3999/v1
set UPSTREAM_API_KEY=mock-key-123
set PORT=3001
"%~dp0node_modules\.bin\tsx.cmd" src/index.ts
