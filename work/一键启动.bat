@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo  Trae Auto Kit Work — 一键注入
echo ============================================
echo.
echo [1/2] 检查 CDP 端口...
powershell -NoProfile -Command "$bad=0; 39341,39342,39343 | ForEach-Object { $p=$_; try { Invoke-WebRequest -UseBasicParsing \"http://127.0.0.1:$p/json/version\" -TimeoutSec 2 | Out-Null; Write-Host \"  PORT $p OK\" } catch { Write-Host \"  PORT $p NOT READY\"; $bad++ } }; if ($bad -eq 3) { exit 2 }"
if errorlevel 2 (
  echo.
  echo 没有可用端口。请先用桌面快捷方式打开 Work：
  echo   TRAE Work CN / 2 / 3（须带 remote-debugging-port 39341/2/3）
  echo.
  pause
  exit /b 2
)

echo.
echo [2/2] 注入 agent-click.js ...
node "%~dp0inject.mjs"
set ERR=%ERRORLEVEL%
echo.
if %ERR%==0 (
  echo 成功。请看 Work 右上角「Trae Auto Kit Work」面板。
) else (
  echo 注入未完全成功，请看 logs\ 或运行 check-ports.bat
)
echo.
pause
exit /b %ERR%
