# Create distribution ZIP for clients
Write-Host "Creating distribution package..." -ForegroundColor Green

$zipPath = "IQR-ShipStation-Connector-Windows.zip"

# Remove old zip if exists
if (Test-Path $zipPath) {
    Remove-Item $zipPath
}

# Create zip
Compress-Archive -Path "build\*" -DestinationPath $zipPath

Write-Host ""
Write-Host "✅ Distribution package created: $zipPath" -ForegroundColor Green
Write-Host ""
Write-Host "This ZIP contains:" -ForegroundColor Cyan
Write-Host "  - IQR-ShipStation-Connector.exe (The main program)"
Write-Host "  - START_CONNECTOR.bat (Easy launcher)"
Write-Host "  - .env.example (Configuration template)"
Write-Host "  - README_FOR_CLIENTS.txt (Full setup guide)"
Write-Host "  - QUICK_START.txt (3-step quick guide)"
Write-Host ""
Write-Host "Send this ZIP file to your clients!" -ForegroundColor Yellow

