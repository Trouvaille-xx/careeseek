# CareeSeek 一键部署脚本（Windows 本地执行）
# 用法:
#   1. 确保 ~/.ssh/your_deploy_key 存在（或 -Key 指定）
#   2. 服务器上 /opt/careeseek/.env.deploy 已配置（见 README）
#   3. 执行:  powershell -ExecutionPolicy Bypass -File deploy\deploy.ps1
param(
  [string]$Server = "YOUR_SERVER_IP",
  [string]$User = "ubuntu",
  [string]$Key = "$env:USERPROFILE\.ssh\your_deploy_key",
  [string]$Project = (Split-Path $PSScriptRoot -Parent)
)
$ErrorActionPreference = "Continue"

if (-not (Test-Path $Key)) { throw "找不到 SSH key: $Key" }
$tgz = Join-Path $env:TEMP "careeseek_deploy.tgz"

Write-Host "[1/4] 打包源码 (排除 node_modules/dist/.git)..."
tar -czf $tgz --exclude=node_modules --exclude=dist --exclude=.git --exclude=pako.min.js -C $Project .
if ($LASTEXITCODE -ne 0) { throw "打包失败" }

Write-Host "[2/4] 上传到 ${User}@${Server} ..."
& scp -i $Key -o BatchMode=yes $tgz "${User}@${Server}:/tmp/careeseek_deploy.tgz"
if ($LASTEXITCODE -ne 0) { throw "scp 上传失败" }

Write-Host "[3/4] 上传服务端部署脚本 ..."
& scp -i $Key -o BatchMode=yes (Join-Path $PSScriptRoot "server-deploy.sh") "${User}@${Server}:/tmp/server-deploy.sh"
if ($LASTEXITCODE -ne 0) { throw "scp 脚本上传失败" }

Write-Host "[4/4] 在服务器执行部署 (构建镜像可能耗时数分钟)..."
& ssh -i $Key -o BatchMode=yes "${User}@${Server}" "bash /tmp/server-deploy.sh"
if ($LASTEXITCODE -ne 0) { throw "服务器部署失败 (exit $LASTEXITCODE)" }

Write-Host "部署完成: http://${Server}:3001/"
