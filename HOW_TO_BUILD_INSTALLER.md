# How to Build the Windows Installer

## Prerequisites

1. **Download Inno Setup** (free):
   - Go to: https://jrsoftware.org/isdl.php
   - Download "Inno Setup 6.x" (latest version)
   - Install it (default settings are fine)

## Steps to Build

### Option 1: Using Inno Setup GUI (Easy)

1. Open **Inno Setup Compiler**
2. Click **File → Open**
3. Select `installer.iss` from this project
4. Click **Build → Compile** (or press F9)
5. Done! The installer will be in `installer-output/` folder

### Option 2: Using Command Line

```powershell
# Make sure Inno Setup is installed
& "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer.iss
```

## What You Get

After building, you'll have:

```
installer-output/
  └── IQR-ShipStation-Connector-Setup.exe  (Professional Windows installer)
```

## Installer Features

✅ **Professional Windows Setup Wizard**
   - Modern UI with progress bars
   - Customizable installation directory
   - Start Menu shortcuts
   - Desktop shortcut (optional)
   - Uninstaller

✅ **API Key Configuration During Install**
   - Users can enter API keys during installation
   - Or skip and configure later

✅ **Automatic Startup Option**
   - Checkbox to run on Windows startup
   - No manual configuration needed

✅ **Built-in Documentation**
   - Opens setup guide after install
   - Quick access to all docs from Start Menu

✅ **Clean Uninstall**
   - Removes all files and shortcuts
   - Cleans up .env and logs

## Customization

### Change App Icon

1. Create or download a `.ico` file (256x256 recommended)
2. Save it as `installer-icon.ico` in the project root
3. Rebuild the installer

### Change Version Number

Edit `installer.iss`:
```
#define MyAppVersion "1.0.0"  ← Change this
```

### Add More Files

Edit the `[Files]` section in `installer.iss`:
```
Source: "path\to\file"; DestDir: "{app}"; Flags: ignoreversion
```

## Distribution

Send `IQR-ShipStation-Connector-Setup.exe` to clients!

They just:
1. Double-click the installer
2. Follow the wizard
3. Enter API keys (or skip)
4. Click Install
5. Done! ✅

## Advantages Over ZIP

✅ More professional
✅ Easier for non-technical users
✅ Automatic Start Menu integration
✅ Built-in uninstaller
✅ Can configure during install
✅ Optional auto-startup
✅ Looks like a "real" Windows app

## File Size

- ZIP version: ~52 MB
- Installer version: ~30 MB (compressed)

The installer is actually smaller because Inno Setup uses better compression!

## Troubleshooting

**"Cannot find LICENSE file"**
- Create a simple LICENSE file or remove that line from installer.iss

**"Cannot find installer-icon.ico"**
- Remove the `SetupIconFile` line from installer.iss
- Or create a simple icon file

**"Inno Setup not found"**
- Make sure you installed Inno Setup
- Check the path in the command line option

## Next Steps

After building the installer:

1. **Test it** on a clean Windows machine
2. **Sign it** (optional, for extra trust):
   - Get a code signing certificate
   - Use SignTool to sign the .exe
3. **Upload to GitHub Releases**
4. **Send to clients**

That's it! 🎉

