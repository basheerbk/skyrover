@echo off
REM Quick hack to create a self-extracting installer using 7-Zip
REM This creates a working offline installer without NSIS or Inno Setup

echo Creating self-extracting installer...

REM Check if 7-Zip is installed
where 7z >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: 7-Zip not found. Install from https://www.7-zip.org/
    echo Or use: winget install 7zip.7zip
    pause
    exit /b 1
)

REM Create the SFX installer
cd /d "%~dp0.."
7z a -sfx7z.sfx "dist-electron\installer\Skyrover.ai.Setup.1.0.13.exe" ".\dist-electron\win-unpacked\*" -mx=5 -mmt=on

echo.
echo Done! Installer created at:
echo dist-electron\installer\Skyrover.ai.Setup.1.0.13.exe
echo.
pause
