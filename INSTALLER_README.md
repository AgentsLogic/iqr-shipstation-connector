# Windows Installer Guide

## 🎯 Two Distribution Options

You now have **TWO ways** to distribute the IQR-ShipStation Connector to clients:

### Option 1: ZIP Package (Simple)
- **File**: `IQR-ShipStation-Connector-Windows.zip`
- **Size**: ~52 MB
- **Best for**: Technical users, quick deployment
- **Setup**: Extract → Configure → Run

### Option 2: Professional Installer (Recommended)
- **File**: `IQR-ShipStation-Connector-Setup.exe`
- **Size**: ~30 MB (compressed)
- **Best for**: Non-technical users, professional deployment
- **Setup**: Double-click → Follow wizard → Done

---

## 📦 Building the Installer

### Prerequisites

1. **Build the .exe first**:
   ```powershell
   npm run build:exe
   ```

2. **Install Inno Setup** (one-time):
   - Download: https://jrsoftware.org/isdl.php
   - Install with default settings

### Build Commands

```powershell
# Build just the installer
npm run build:installer

# Build both .exe and installer
npm run build:all
```

Or manually:
```powershell
powershell -ExecutionPolicy Bypass -File build-installer.ps1
```

### Output

After building, you'll find:
```
installer-output/
  └── IQR-ShipStation-Connector-Setup.exe
```

---

## ✨ Installer Features

### During Installation

✅ **Modern Setup Wizard**
   - Professional Windows installer UI
   - Progress bars and status updates
   - Customizable install location

✅ **API Key Configuration**
   - Enter API keys during installation
   - Or skip and configure later
   - Automatically creates .env file

✅ **Startup Options**
   - Checkbox to run on Windows startup
   - No manual Task Scheduler setup needed

✅ **Desktop Shortcut**
   - Optional desktop icon
   - Quick access to the connector

### After Installation

✅ **Start Menu Integration**
   - "IQR-ShipStation Connector" folder
   - Launch connector
   - Edit configuration
   - View documentation
   - Uninstall

✅ **Documentation Access**
   - Quick Start Guide
   - Full README
   - Opens automatically after install

✅ **Clean Uninstall**
   - Removes all files
   - Cleans up shortcuts
   - Removes .env and logs

---

## 📧 Sending to Clients

### Email Template

```
Subject: IQR-ShipStation Connector - Professional Installer

Hi [Client Name],

I've prepared a professional installer for the IQR-ShipStation 
connector that will automatically sync your orders.

Installation is super simple:

1. Download the attached installer
2. Double-click to run it
3. Follow the setup wizard
4. Enter your API keys (or skip and do it later)
5. Click Install
6. Done!

The installer will:
✅ Install the connector
✅ Create Start Menu shortcuts
✅ Optionally add a desktop shortcut
✅ Optionally run on Windows startup
✅ Show you the setup guide

File: IQR-ShipStation-Connector-Setup.exe
Size: ~30 MB

Let me know if you need any help!
```

### Distribution Methods

1. **Email** (if under 25 MB limit)
2. **Cloud Storage** (Dropbox, Google Drive, OneDrive)
3. **USB Drive**
4. **GitHub Releases** (recommended for updates)

---

## 🎨 Customization

### Change App Icon

1. Create or download a `.ico` file (256x256 px)
2. Save as `installer-icon.ico` in project root
3. Rebuild installer

Free icon resources:
- https://icon-icons.com/
- https://www.flaticon.com/
- https://icons8.com/

### Change Version Number

Edit `installer.iss`:
```ini
#define MyAppVersion "1.0.0"  ← Change this
```

### Add More Files

Edit `installer.iss` in the `[Files]` section:
```ini
Source: "path\to\file"; DestDir: "{app}"; Flags: ignoreversion
```

### Customize Wizard Pages

Edit `installer.iss` in the `[Code]` section to add custom pages.

---

## 🔒 Code Signing (Optional but Recommended)

### Why Sign?

✅ Removes "Unknown Publisher" warning
✅ Builds trust with clients
✅ Prevents Windows SmartScreen warnings
✅ Looks more professional

### How to Sign

1. **Get a Code Signing Certificate**
   - DigiCert (~$400/year)
   - Sectigo (~$200/year)
   - Comodo (~$150/year)

2. **Sign the Installer**
   ```powershell
   signtool sign /f "certificate.pfx" /p "password" /t http://timestamp.digicert.com "installer-output\IQR-ShipStation-Connector-Setup.exe"
   ```

3. **Verify**
   - Right-click the .exe
   - Properties → Digital Signatures
   - Should show your company name

---

## 🧪 Testing

### Before Sending to Clients

1. **Test on a clean Windows VM**
   - Windows 10 or 11
   - No Node.js installed
   - Fresh install

2. **Test the installation**
   - Run the installer
   - Enter test API keys
   - Verify shortcuts work
   - Test the connector starts

3. **Test the uninstaller**
   - Uninstall via Control Panel
   - Verify all files removed
   - Check Start Menu cleaned up

### Test Checklist

- [ ] Installer runs without errors
- [ ] API keys save correctly
- [ ] Connector starts and runs
- [ ] Start Menu shortcuts work
- [ ] Desktop shortcut works (if selected)
- [ ] Auto-startup works (if selected)
- [ ] Documentation opens
- [ ] Uninstaller removes everything

---

## 📊 Comparison: ZIP vs Installer

| Feature | ZIP Package | Installer |
|---------|-------------|-----------|
| File Size | ~52 MB | ~30 MB |
| Setup Difficulty | Medium | Easy |
| Professional Look | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Start Menu Integration | ❌ | ✅ |
| Uninstaller | ❌ | ✅ |
| Auto-startup Option | Manual | Checkbox |
| API Key Setup | Manual | During install |
| Best For | Developers | End users |

---

## 🚀 GitHub Releases

### Create a Release

1. Go to your GitHub repo
2. Click "Releases" → "Create a new release"
3. Tag: `v1.0.0`
4. Title: `IQR-ShipStation Connector v1.0.0`
5. Upload both:
   - `IQR-ShipStation-Connector-Windows.zip`
   - `IQR-ShipStation-Connector-Setup.exe`
6. Publish release

### Benefits

✅ Version tracking
✅ Download statistics
✅ Automatic update notifications
✅ Professional distribution

---

## 🆘 Troubleshooting

### "Inno Setup not found"
- Install from: https://jrsoftware.org/isdl.php
- Make sure it's in default location

### "Cannot find .exe"
- Run `npm run build:exe` first

### "Windows SmartScreen warning"
- Normal for unsigned installers
- Users can click "More info" → "Run anyway"
- Or get a code signing certificate

### "Installer won't run"
- Check antivirus isn't blocking it
- Try running as administrator

---

## 📝 Next Steps

1. ✅ Build the installer
2. ✅ Test it thoroughly
3. ✅ (Optional) Sign it
4. ✅ Upload to GitHub Releases
5. ✅ Send to clients
6. ✅ Collect feedback
7. ✅ Iterate and improve

---

## 🎉 You're Done!

You now have a professional Windows installer that makes deployment super easy for your clients!

Questions? Check the main README or open an issue on GitHub.

