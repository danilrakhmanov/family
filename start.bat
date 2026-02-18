@echo off
echo Starting OurHome application...
echo.
echo If you get a PowerShell error, run this command first:
echo   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
echo.
echo Or use this command to run npm directly:
echo   node node_modules\next\dist\bin\next dev
echo.
cd /d "%~dp0"
node node_modules\next\dist\bin\next dev
