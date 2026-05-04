@echo off
title NetPulse Scheduler
color 0B
cd /d %1
echo NetPulse Scheduler - Running every 30 seconds
echo ================================================
echo.

:loop
echo [%time%] Running schedule...
cd /d %1\netpulse-api
php artisan schedule:run
timeout /t 30 /nobreak >nul
goto loop