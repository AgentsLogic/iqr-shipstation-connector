# Build Windows Installer using Inno Setup
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IQR-ShipStation Installer Builder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Inno Setup is installed
$innoSetupPaths = @(
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    "C:\Program Files\Inno Setup 6\ISCC.exe",
    "C:\Program Files (x86)\Inno Setup 5\ISCC.exe",
    "C:\Program Files\Inno Setup 5\ISCC.exe"
)

$isccPath = $null
foreach ($path in $innoSetupPaths) {
    if (Test-Path $path) {
        $isccPath = $path
        break
    }
}

if (-not $isccPath) {
    Write-Host "❌ ERROR: Inno Setup not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Inno Setup first:" -ForegroundColor Yellow
    Write-Host "  1. Go to: https://jrsoftware.org/isdl.php" -ForegroundColor Yellow
    Write-Host "  2. Download and install Inno Setup 6" -ForegroundColor Yellow
    Write-Host "  3. Run this script again" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or use the GUI:" -ForegroundColor Cyan
    Write-Host "  1. Open Inno Setup Compiler" -ForegroundColor Cyan
    Write-Host "  2. File → Open → installer.iss" -ForegroundColor Cyan
    Write-Host "  3. Build → Compile (F9)" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host "✅ Found Inno Setup: $isccPath" -ForegroundColor Green
Write-Host ""

# Check if .exe exists
if (-not (Test-Path "build\IQR-ShipStation-Connector.exe")) {
    Write-Host "❌ ERROR: IQR-ShipStation-Connector.exe not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please build the .exe first:" -ForegroundColor Yellow
    Write-Host "  npm run build:exe" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ Found .exe file" -ForegroundColor Green
Write-Host ""

# Create installer-icon.ico if it doesn't exist
if (-not (Test-Path "installer-icon.ico")) {
    Write-Host "⚠️  No installer-icon.ico found, using default icon" -ForegroundColor Yellow
    Write-Host ""
}

# Build the installer
Write-Host "Building installer..." -ForegroundColor Cyan
Write-Host ""

try {
    & $isccPath "installer.iss"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  ✅ INSTALLER BUILT SUCCESSFULLY!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Output:" -ForegroundColor Cyan
        Write-Host "  installer-output\IQR-ShipStation-Connector-Setup.exe" -ForegroundColor White
        Write-Host ""
        Write-Host "File size:" -ForegroundColor Cyan
        $installerPath = "installer-output\IQR-ShipStation-Connector-Setup.exe"
        if (Test-Path $installerPath) {
            $size = (Get-Item $installerPath).Length / 1MB
            Write-Host "  $([math]::Round($size, 2)) MB" -ForegroundColor White
        }
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Test the installer on a clean Windows machine" -ForegroundColor White
        Write-Host "  2. Send it to your clients!" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Build failed! Check the errors above." -ForegroundColor Red
        Write-Host ""
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
}

