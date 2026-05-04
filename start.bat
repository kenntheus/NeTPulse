@echo off
title NetPulse - Network Monitor
color 0A

echo.
echo  NetPulse - Network Monitor
echo  ================================================
echo.

if not exist "netpulse-api\artisan" (
    echo  [ERROR] Run this from your NeTPulse root folder.
    echo  Expected: C:\codesss\NeTPulse\
    pause
    exit /b 1
)

:: Store root path
set ROOT=%CD%

echo  [1/3] Starting Laravel API server...
start "NetPulse API" cmd /k "cd /d %ROOT%\netpulse-api && php artisan config:clear && php artisan serve"

timeout /t 3 /nobreak >nul

echo  [2/3] Starting Scheduler...
start "NetPulse Scheduler" cmd /k "%ROOT%\scheduler.bat %ROOT%"

timeout /t 2 /nobreak >nul

echo  [3/3] Starting React frontend...
start "NetPulse UI" cmd /k "cd /d %ROOT%\netpulse-ui && npm run dev"

echo.
echo  ================================================
echo  Done! Opening browser in 3 seconds...
echo.
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"