@echo off
chcp 65001 >nul
powershell -NoProfile -Command "$procs = Get-CimInstance Win32_Process -Filter \"name='node.exe'\" | Where-Object { $_.CommandLine -match 'trae-auto-kit\\cn\\watch\.mjs' }; if (-not $procs) { Write-Host 'CN watch not running.'; exit 0 }; $procs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Host ('Stopped PID ' + $_.ProcessId) }"
pause
