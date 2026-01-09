@echo off
REM IQR-ShipStation Connector - Windows Startup Script

echo ========================================
echo IQR-ShipStation Connector
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Check if dependencies are installed
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

REM Check if code is compiled
if not exist "dist\" (
    echo Building application...
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to build application
        pause
        exit /b 1
    )
    echo.
)

REM Check if .env file exists
if not exist ".env" (
    echo WARNING: .env file not found
    echo Please create .env file with your API credentials
    echo See .env.example for reference
    pause
    exit /b 1
)

echo Starting server...
echo.
echo Server will start on port 3001 (or PORT from .env)
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

REM Start the server
node dist/index.js

pause

