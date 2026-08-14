@echo off
chcp 65001 >nul
cd /d "D:\Apps\trae-auto-kit"
echo Starting Trae Auto Kit watchers (cn / work / intl / work-intl)...
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\Apps\trae-auto-kit\cn\start-watch.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\Apps\trae-auto-kit\work\start-watch.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\Apps\trae-auto-kit\intl\start-watch.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\Apps\trae-auto-kit\work-intl\start-watch.ps1"
echo Done. Watchers should be running in background.
timeout /t 3 >nul