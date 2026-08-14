@echo off
chcp 65001 >nul
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-watch.ps1"
echo.
echo 常驻监视已启动（Work）。停止请双击 停止.bat
timeout /t 3 >nul
exit /b 0
