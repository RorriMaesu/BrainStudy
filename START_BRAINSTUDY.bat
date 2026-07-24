@echo off
setlocal
title BrainStudy
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo BrainStudy needs Node.js 22 or newer.
  echo Download it from https://nodejs.org/ and run this file again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing BrainStudy packages for the first launch...
  call npm ci
  if errorlevel 1 (
    echo Installation failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)

echo Starting the BrainStudy laboratory...
start "BrainStudy server" cmd /c "npm run dev -- --host 127.0.0.1 --strictPort"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$url='http://127.0.0.1:5173'; for($i=0;$i -lt 60;$i++){ try { $r=Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 1; if($r.StatusCode -ge 200){ exit 0 } } catch {}; Start-Sleep -Milliseconds 500 }; exit 1"

if errorlevel 1 (
  echo.
  echo BrainStudy did not become ready. Review the server window for details.
  pause
  exit /b 1
)

start "" "http://127.0.0.1:5173"
endlocal
