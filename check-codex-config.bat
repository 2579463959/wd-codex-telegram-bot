@echo off
setlocal EnableExtensions

set "APP_DIR=%~dp0"
cd /d "%APP_DIR%" || (
  echo Failed to enter project directory: %APP_DIR%
  pause
  exit /b 1
)

node scripts\check_codex_config.mjs
pause
