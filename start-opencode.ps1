# CareeSeek 一键启动（真实上游：OpenCode Go / deepseek-v4-flash）
# 用法: pwsh -File start-opencode.ps1  （在项目根目录运行）
# 说明: 后端以 OpenCode Go 为上游；API Key 从 ~/.dsh/.credentials.yaml 的 OPENCODE_GO_API_KEY 读取，
#       不在此文件落盘。会话身份头 x-opencode-session 用固定 UUID（OpenCode Go 强制要求）。
#       Node 运行时自动探测（pi-node → DSH 运行时 → PATH），可用 $env:CARESEEK_NODE 覆盖。
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# 读取上游 key：环境变量 → DSH 凭据文件。找不到也能启动（BYOK 直连不依赖服务端 key，仅托管模式需要）
$credNames = @('OPENCODE_GO_API_KEY', 'OPENCODE_DEEPSEEK_API_KEY', 'DEEPSEEK_API_KEY')
$key = $null
$keyName = $null
foreach ($n in $credNames) {
  if ((Get-Item "env:$n" -ErrorAction SilentlyContinue)) { $key = (Get-Item "env:$n").Value; $keyName = $n; break }
}
$credPath = Join-Path $env:USERPROFILE '.dsh\.credentials.yaml'
if (-not $key -and (Test-Path $credPath)) {
  $raw = Get-Content $credPath -Raw
  foreach ($n in $credNames) {
    if ($raw -match "(?m)^\s*${n}:\s*['`"]?([^\s'`"]+)") { $key = $Matches[1]; $keyName = $n; break }
  }
}

# 上游与 key 成对选择：opencode 的 key 配 opencode 网关，DeepSeek 官方 key 配官方端点
if ($env:UPSTREAM_BASE_URL) {
  $upstream = $env:UPSTREAM_BASE_URL
} elseif ($keyName -like 'OPENCODE*') {
  $upstream = 'https://opencode.ai/zen/go/v1'
} else {
  $upstream = 'https://api.deepseek.com/v1'
}

if ($key) {
  Write-Host "== 上游凭据: $keyName（$upstream）=="
} else {
  Write-Host '[提示] 未找到上游 key，后端仍会启动：BYOK 模式由浏览器携带自己的 key，托管模式需先配置 UPSTREAM_API_KEY'
}

Write-Host "== 启动后端（3001，上游 $upstream）=="
$env:UPSTREAM_BASE_URL = $upstream
$env:UPSTREAM_API_KEY = $key
# opencode 网关强制要求会话身份头；用固定 UUID，不落盘任何密钥
if ($upstream -like '*opencode*') {
  $env:UPSTREAM_EXTRA_HEADERS = "{`"x-opencode-session`":`"careeseek-opencode-9f2c4a7e`"}"
} else {
  $env:UPSTREAM_EXTRA_HEADERS = ''
}
$env:PORT = '3001'

# 管理员与提示词维护白名单：启动时会把该邮箱提升为 role=admin（前端入口 + 后端接口双重校验）
if (-not $env:ADMIN_EMAILS) { $env:ADMIN_EMAILS = 'admin@example.com' }
if (-not $env:PROMPT_ADMIN_EMAILS) { $env:PROMPT_ADMIN_EMAILS = $env:ADMIN_EMAILS }

# 解析 Node 运行时：优先 $env:CARESEEK_NODE，其次历史路径，最后回退到 PATH 上的 node
$nodeExe = $env:CARESEEK_NODE
if (-not $nodeExe) {
  $nodeExe = @(
    "$env:LOCALAPPDATA\pi-node\current\node.exe",
    "$env:USERPROFILE\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe"
  ) | Where-Object { Test-Path $_ } | Select-Object -First 1
}
if (-not $nodeExe) { $nodeExe = (Get-Command node -ErrorAction SilentlyContinue).Source }
if (-not $nodeExe) { Write-Host '[错误] 未找到 node 运行时（可用 $env:CARESEEK_NODE 指定）'; exit 1 }
Write-Host ("Node 运行时: " + $nodeExe + " (" + (& $nodeExe -v) + ")")

# 日志落盘，避免启动失败时无声无息
$null = Start-Process -FilePath $nodeExe `
  -ArgumentList '--import','tsx','src/index.ts' `
  -WorkingDirectory (Join-Path $root 'server') -WindowStyle Hidden `
  -RedirectStandardOutput (Join-Path $root 'server\srv.log') `
  -RedirectStandardError (Join-Path $root 'server\srv-err.log')
Start-Sleep -Seconds 6

$up = $false
try { $up = (Invoke-WebRequest -UseBasicParsing 'http://localhost:3001/health' -TimeoutSec 6).StatusCode -eq 200 } catch { $up = $false }
if ($up) {
  Write-Host '后端就绪: http://localhost:3001/health'
} else {
  Write-Host '后端未就绪，查看 server\srv-err.log'
  Write-Host '（常见原因：better-sqlite3 与本机 Node ABI 不一致 → 在 server 目录执行 npm rebuild better-sqlite3）'
}

Write-Host "== 启动前端（5173）=="
$feUp = $false
try { $feUp = (Invoke-WebRequest -UseBasicParsing 'http://localhost:5173/' -TimeoutSec 4).StatusCode -eq 200 } catch { $feUp = $false }
if ($feUp) {
  Write-Host '前端已在运行，跳过'
} else {
  $null = Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -WorkingDirectory $root -WindowStyle Hidden
  Start-Sleep -Seconds 6
}
Write-Host "完成：前端 http://localhost:5173 丨 后端 http://localhost:3001（/health）"
