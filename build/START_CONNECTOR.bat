@echo off
title IQR-ShipStation Connector
color 0A

echo.
echo ========================================
echo   IQR-ShipStation Connector
echo ========================================
echo.
echo Starting the connector...
echo.

REM Check if .env file exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo.
    echo Please copy .env.example to .env and fill in your API keys.
    echo.
    pause
    exit
)

REM Start the connector
IQR-ShipStation-Connector.exe

pause

