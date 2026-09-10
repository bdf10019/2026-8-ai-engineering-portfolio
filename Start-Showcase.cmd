@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Use the standalone EXE or install Node.js 22+.
  pause
  exit /b 1
)
echo AXIS-09 - http://127.0.0.1:4173/
echo Keep this window open while viewing the website.
node server.mjs
pause

