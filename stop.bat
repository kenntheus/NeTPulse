@echo off
title NetPulse - Stopping...
color 0C

echo.
echo  NetPulse - Stopping all services...
echo  ================================================

:: Kill by window title (matches the titles set in start.bat)
echo  Closing NetPulse API window...
taskkill /f /fi "WINDOWTITLE eq NetPulse API" >nul 2>&1

echo  Closing NetPulse Scheduler window...
taskkill /f /fi "WINDOWTITLE eq NetPulse Scheduler" >nul 2>&1

echo  Closing NetPulse UI window...
taskkill /f /fi "WINDOWTITLE eq NetPulse UI" >nul 2>&1

:: Also kill the processes themselves in case windows are already closed
echo  Stopping PHP processes...
taskkill /f /im php.exe >nul 2>&1

echo  Stopping Node processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo  ================================================
echo  [OK] All NetPulse services stopped.
echo  ================================================
echo.
echo  Press any key to close this window...
pause >nul