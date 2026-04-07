@echo off
setlocal

set PROJECT_DIR=C:\Users\User\content_dashboard
set LOG_DIR=%PROJECT_DIR%\data\logs

cd /d %PROJECT_DIR%

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

:: Generate date-stamped log filename (YYYY-MM-DD)
for /f %%a in ('powershell -nologo -command "Get-Date -Format yyyy-MM-dd"') do set DS=%%a

set LOG_FILE=%LOG_DIR%\pipeline-%DS%.log

echo [%date% %time%] ===== Pipeline starting ===== >> "%LOG_FILE%"

node cron/full-pipeline.js >> "%LOG_FILE%" 2>&1

echo [%date% %time%] ===== Pipeline finished (exit code: %ERRORLEVEL%) ===== >> "%LOG_FILE%"

endlocal
