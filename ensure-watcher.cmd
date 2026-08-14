@echo off
set PRODUCT=%~1
set KIT=D:\Apps\trae-auto-kit
if "%PRODUCT%"=="" exit /b 1
if not exist "%KIT%\%PRODUCT%\start-watch.ps1" exit /b 1
powershell -NoProfile -ExecutionPolicy Bypass -File "%KIT%\%PRODUCT%\start-watch.ps1"
exit /b %ERRORLEVEL%