; Quick test to verify path resolution
#define ProjectRoot ExtractFilePath(ExtractFilePath(SourcePath))

[Setup]
AppName=Test
AppVersion=1.0
DefaultDirName={tmp}\test
OutputDir={#ProjectRoot}\dist-electron\installer
OutputBaseFilename=test

[Messages]
SetupWindowTitle=ProjectRoot is: {#ProjectRoot}

[Code]
function InitializeSetup(): Boolean;
begin
  MsgBox('ProjectRoot: {#ProjectRoot}' + #13#10 + 
         'Icon: {#ProjectRoot}\ico\favicon.ico' + #13#10 +
         'Source: {#ProjectRoot}\dist-electron\win-unpacked', mbInformation, MB_OK);
  Result := False; // Don't actually install
end;
