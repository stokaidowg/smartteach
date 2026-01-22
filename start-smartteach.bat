@echo off
REM SmartTeach School Management System - Startup Script (Batch Version)
REM This script starts both the backend server and frontend client

echo =================================================
echo   SmartTeach School Management System
echo   Starting Application...
echo =================================================
echo.

REM Get the script directory
set SCRIPT_DIR=%~dp0
set BACKEND_DIR=%SCRIPT_DIR%school-management-system
set CLIENT_DIR=%BACKEND_DIR%\client

REM Check if Node.js is installed
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo       ERROR: Node.js is not installed!
    echo       Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo       Node.js version: %NODE_VERSION%

REM Check backend dependencies
echo [2/6] Checking backend dependencies...
cd /d "%BACKEND_DIR%"
if not exist "node_modules" (
    echo       Installing backend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo       ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
) else (
    echo       Backend dependencies already installed
)

REM Check frontend dependencies
echo [3/6] Checking frontend dependencies...
cd /d "%CLIENT_DIR%"
if not exist "node_modules" (
    echo       Installing frontend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo       ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
) else (
    echo       Frontend dependencies already installed
)

REM Start backend server
echo [4/6] Starting backend server...
cd /d "%BACKEND_DIR%"
start "SmartTeach Backend (Port 3001)" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

REM Start frontend client
echo [5/6] Starting frontend client...
cd /d "%CLIENT_DIR%"
start "SmartTeach Frontend (Port 3000)" cmd /k "npm start"
timeout /t 2 /nobreak >nul

echo.
echo =================================================
echo   SmartTeach is starting up!
echo =================================================
echo.
echo Backend API:  http://localhost:3001
echo Frontend UI:  http://localhost:3000
echo.
echo Two command windows have been opened:
echo   1. Backend Server (Port 3001)
echo   2. Frontend Client (Port 3000)
echo.
echo The browser should open automatically in a few seconds...
echo If not, manually navigate to: http://localhost:3000
echo.
echo To stop the servers, close both command windows
echo or press Ctrl+C in each window.
echo.
pause
