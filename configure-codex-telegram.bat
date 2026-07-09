@echo off
setlocal EnableExtensions

set "APP_DIR=%~dp0"
cd /d "%APP_DIR%" || (
  echo Failed to enter project directory: %APP_DIR%
  pause
  exit /b 1
)

if not exist ".env" (
  if exist ".env.minimal.example" (
    copy ".env.minimal.example" ".env" >nul
  ) else (
    echo Missing .env and .env.minimal.example.
    pause
    exit /b 1
  )
)

echo.
echo Codex Telegram Bot configuration
echo.
echo 1. Get TELEGRAM_BOT_TOKEN from Telegram @BotFather.
echo 2. Get your numeric Telegram user id from Telegram @userinfobot.
echo.

set "BOT_TOKEN="
set /p "BOT_TOKEN=Paste TELEGRAM_BOT_TOKEN: "
if "%BOT_TOKEN%"=="" (
  echo TELEGRAM_BOT_TOKEN cannot be empty.
  pause
  exit /b 1
)

set "USER_IDS="
set /p "USER_IDS=Paste ALLOWED_USER_IDS: "
if "%USER_IDS%"=="" (
  echo ALLOWED_USER_IDS cannot be empty.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$envPath = Join-Path $env:APP_DIR '.env'; $token = $env:BOT_TOKEN; $ids = $env:USER_IDS; if ($token -notmatch '^\d+:[A-Za-z0-9_-]+$') { Write-Error 'TELEGRAM_BOT_TOKEN format looks wrong. Expected something like 123456789:ABC...'; exit 2 }; if ($ids -notmatch '^\d+(,\d+)*$') { Write-Error 'ALLOWED_USER_IDS must be numeric ids, separated by commas if there are multiple users.'; exit 3 }; $backup = $envPath + '.bak'; Copy-Item -LiteralPath $envPath -Destination $backup -Force; $content = Get-Content -Raw -LiteralPath $envPath; if ($content -notmatch '(?m)^TELEGRAM_BOT_TOKEN=') { $content = 'TELEGRAM_BOT_TOKEN=' + $token + [Environment]::NewLine + $content } else { $content = $content -replace '(?m)^TELEGRAM_BOT_TOKEN=.*$', ('TELEGRAM_BOT_TOKEN=' + $token) }; if ($content -notmatch '(?m)^ALLOWED_USER_IDS=') { $content = $content + [Environment]::NewLine + 'ALLOWED_USER_IDS=' + $ids + [Environment]::NewLine } else { $content = $content -replace '(?m)^ALLOWED_USER_IDS=.*$', ('ALLOWED_USER_IDS=' + $ids) }; Set-Content -LiteralPath $envPath -Value $content -NoNewline -Encoding UTF8; Write-Host 'Updated .env'; Write-Host ('Backup saved to ' + $backup)"
if errorlevel 1 (
  echo.
  echo Configuration failed. .env was not updated.
  pause
  exit /b 1
)

echo.
echo Configuration complete.
echo Now run start-codex-telegram.bat.
pause
