; IQR-ShipStation Connector Installer Script
; Requires Inno Setup 6.0 or later
; Download from: https://jrsoftware.org/isdl.php

#define MyAppName "IQR-ShipStation Connector"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "AgentsLogic"
#define MyAppURL "https://github.com/AgentsLogic/iqr-shipstation-connector"
#define MyAppExeName "IQR-ShipStation-Connector.exe"

[Setup]
; Basic app info
AppId={{8F9A2B3C-4D5E-6F7A-8B9C-0D1E2F3A4B5C}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=LICENSE
OutputDir=installer-output
OutputBaseFilename=IQR-ShipStation-Connector-Setup
SetupIconFile=installer-icon.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "startupicon"; Description: "Run automatically on Windows startup"; GroupDescription: "Startup Options:"; Flags: unchecked

[Files]
Source: "build\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "build\.env.example"; DestDir: "{app}"; Flags: ignoreversion
Source: "build\README_FOR_CLIENTS.txt"; DestDir: "{app}"; Flags: ignoreversion isreadme
Source: "build\QUICK_START.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "build\START_CONNECTOR.bat"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\START_CONNECTOR.bat"; IconFilename: "{app}\{#MyAppExeName}"
Name: "{group}\Configuration"; Filename: "notepad.exe"; Parameters: "{app}\.env"; WorkingDir: "{app}"
Name: "{group}\Quick Start Guide"; Filename: "{app}\QUICK_START.txt"
Name: "{group}\Full Documentation"; Filename: "{app}\README_FOR_CLIENTS.txt"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\START_CONNECTOR.bat"; IconFilename: "{app}\{#MyAppExeName}"; Tasks: desktopicon
Name: "{userstartup}\{#MyAppName}"; Filename: "{app}\START_CONNECTOR.bat"; Tasks: startupicon

[Run]
Filename: "{app}\README_FOR_CLIENTS.txt"; Description: "View Setup Guide"; Flags: postinstall shellexec skipifsilent
Filename: "notepad.exe"; Parameters: "{app}\.env.example"; Description: "Configure API Keys Now"; Flags: postinstall skipifsilent unchecked

[Code]
var
  ConfigPage: TInputQueryWizardPage;
  IQRApiKey, ShipStationApiKey, ShipStationApiSecret: String;

procedure InitializeWizard;
begin
  ConfigPage := CreateInputQueryPage(wpSelectTasks,
    'API Configuration', 'Enter your API keys',
    'You can enter your API keys now, or configure them later by editing the .env file.');
  
  ConfigPage.Add('IQ Reseller API Key:', False);
  ConfigPage.Add('ShipStation API Key:', False);
  ConfigPage.Add('ShipStation API Secret:', False);
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  EnvContent: TStringList;
  EnvFile: String;
begin
  if CurStep = ssPostInstall then
  begin
    IQRApiKey := ConfigPage.Values[0];
    ShipStationApiKey := ConfigPage.Values[1];
    ShipStationApiSecret := ConfigPage.Values[2];
    
    if (IQRApiKey <> '') or (ShipStationApiKey <> '') or (ShipStationApiSecret <> '') then
    begin
      EnvFile := ExpandConstant('{app}\.env');
      EnvContent := TStringList.Create;
      try
        EnvContent.LoadFromFile(ExpandConstant('{app}\.env.example'));
        
        if IQRApiKey <> '' then
          EnvContent.Values['IQR_API_KEY'] := IQRApiKey;
        if ShipStationApiKey <> '' then
          EnvContent.Values['SHIPSTATION_API_KEY'] := ShipStationApiKey;
        if ShipStationApiSecret <> '' then
          EnvContent.Values['SHIPSTATION_API_SECRET'] := ShipStationApiSecret;
        
        EnvContent.SaveToFile(EnvFile);
      finally
        EnvContent.Free;
      end;
    end;
  end;
end;

[UninstallDelete]
Type: files; Name: "{app}\.env"
Type: filesandordirs; Name: "{app}\logs"

