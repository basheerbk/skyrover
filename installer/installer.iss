; Inno Setup script to build a single-file installer for Skyrover IDE
; Build with: iscc installer\installer.iss

#define MyAppName "Skyrover"
#define MyAppVersion "1.0.14"
#define MyAppPublisher "Skyrover.ai"
#define MyAppExeName "Skyrover.ai.exe"

[Setup]
; NOTE: The value of AppId uniquely identifies this application.
AppId={{A7F0C7A8-44E2-4D8D-B8F0-3E5B6F3F6F10}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
; Install to Program Files (Standard for Admin installs)
DefaultDirName={autopf}\Skyrover.ai
DefaultGroupName={#MyAppName}
OutputDir=..\dist-electron\installer
OutputBaseFilename=Skyrover.ai.Setup.{#MyAppVersion}
; SourceDir is expected to be relative to this .iss file location
SourceDir=..\dist-electron\win-unpacked
SetupIconFile=C:\Users\ASUS\blockide\ico\favicon.ico

; Compression options for large bundle (600MB+)
; Using normal compression instead of ultra to prevent resource exhaustion
Compression=lzma2
SolidCompression=yes
; LZMAUseSeparateProcess=yes  ; Disabled - can cause issues with large files

; Require Admin for Drivers
PrivilegesRequired=admin
DisableDirPage=no
DisableProgramGroupPage=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
; Include the entire unpacked electron build (including resources/arduino_data and drivers)
Source: "*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{commondesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional shortcuts:"

[Run]
; Install CH340 Driver
Filename: "{app}\resources\drivers\ch340\CH341SER.EXE"; Parameters: "/S"; StatusMsg: "Installing CH340 Drivers..."; Flags: runascurrentuser waituntilterminated

; Install CP210x Driver (Universal - using PnPutil)
; x64
Filename: "pnputil.exe"; Parameters: "/add-driver ""{app}\resources\drivers\silabser.inf"" /install"; StatusMsg: "Installing CP210x Drivers..."; Flags: runascurrentuser waituntilterminated; Check: Is64BitInstallMode

; Launch App
Filename: "{app}\{#MyAppExeName}"; Description: "Launch {#MyAppName}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
; Clean up the managed Cores folder on uninstall
Type: filesandordirs; Name: "{localappdata}\Skyrover.ai\arduino_ide_cores"
; NOTE: We intentionally DO NOT delete arduino_ide_user to preserve user sketches/libs
