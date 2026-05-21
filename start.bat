@echo off
rem ReversiCoach launcher - double-click to play in your browser.
rem (Messages are in English: cmd.exe cannot reliably display Japanese in .bat files.)
cd /d "%~dp0"
title ReversiCoach

echo ========================================
echo   ReversiCoach
echo ========================================
echo.

where npm >nul 2>nul
if errorlevel 1 goto NO_NPM

if not exist "node_modules\" goto INSTALL
goto RUN

:INSTALL
echo First run: installing dependencies. This may take a minute...
echo.
call npm install
if errorlevel 1 goto INSTALL_FAILED
echo.
goto RUN

:RUN
echo Starting the dev server. Your browser will open automatically.
echo To stop, just close this window.
echo ----------------------------------------
echo.
call npm run dev
echo.
echo Server stopped.
pause
exit /b 0

:NO_NPM
echo [ERROR] Node.js / npm not found.
echo Please install Node.js, then run this file again.
echo.
pause
exit /b 1

:INSTALL_FAILED
echo.
echo [ERROR] Failed to install dependencies.
echo Please check your network connection, then run this file again.
echo.
pause
exit /b 1
