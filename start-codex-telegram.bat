@echo off
setlocal EnableExtensions

set "APP_DIR=%~dp0"
cd /d "%APP_DIR%" || (
  echo Failed to enter project directory: %APP_DIR%
  pause
  exit /b 1
)

if not exist ".env" (
  echo Missing .env file.
  echo Copy .env.minimal.example to .env, then set TELEGRAM_BOT_TOKEN and ALLOWED_USER_IDS.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found in PATH. Install Node.js first, then try again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo node_modules was not found. Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

echo Preparing Codex profile config...
node scripts\prepare_codex_profile.mjs
if errorlevel 1 (
  echo Failed to prepare Codex profile config.
  pause
  exit /b 1
)

echo Applying Codex SDK profile support...
node scripts\patch_codex_sdk_profile.mjs
if errorlevel 1 (
  echo Failed to apply Codex SDK profile support.
  pause
  exit /b 1
)

findstr /C:"TELEGRAM_BOT_TOKEN=123456789:replace_me" ".env" >nul
if not errorlevel 1 (
  echo.
  echo .env still contains the placeholder TELEGRAM_BOT_TOKEN.
  echo Replace it with the token from Telegram @BotFather, then run this file again.
  echo.
  start notepad ".env"
  pause
  exit /b 1
)

findstr /C:"ALLOWED_USER_IDS=123456789" ".env" >nul
if not errorlevel 1 (
  echo.
  echo .env still contains the placeholder ALLOWED_USER_IDS.
  echo Replace it with your numeric Telegram user id, then run this file again.
  echo.
  start notepad ".env"
  pause
  exit /b 1
)

echo Starting Codex Telegram worker...
start "Codex Telegram Worker" /D "%APP_DIR%" cmd /k "npm run start:worker"

timeout /t 2 /nobreak >nul

echo Starting Codex Telegram bot...
start "Codex Telegram Bot" /D "%APP_DIR%" cmd /k "npm start"

echo.
echo Started. Keep both opened windows running.
echo Send /start to your Telegram bot after TELEGRAM_BOT_TOKEN and ALLOWED_USER_IDS are configured.
pause
