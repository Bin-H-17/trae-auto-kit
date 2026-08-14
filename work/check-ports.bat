@echo off
chcp 65001 >nul
echo Checking Trae Work CDP ports...
powershell -NoProfile -Command "39341,39342,39343 | ForEach-Object { $p=$_; try { Invoke-WebRequest -UseBasicParsing \"http://127.0.0.1:$p/json/version\" -TimeoutSec 2 | Out-Null; Write-Host \"PORT $p OK\" } catch { Write-Host \"PORT $p NOT READY\" } }"
pause
