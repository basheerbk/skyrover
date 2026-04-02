@echo off
REM HACK: Create a portable version that works offline
REM This is faster than fighting with installers

echo ========================================
echo  Blockcode Portable Package Creator
echo ========================================
echo.

REM Create portable package directory
set PORTABLE_DIR=dist-electron\portable
if exist "%PORTABLE_DIR%" rmdir /s /q "%PORTABLE_DIR%"
mkdir "%PORTABLE_DIR%"

echo Copying files...
xcopy /E /I /Y "dist-electron\win-unpacked" "%PORTABLE_DIR%\Blockcode"

REM Create launcher script
echo @echo off > "%PORTABLE_DIR%\Blockcode.bat"
echo cd /d "%%~dp0Blockcode" >> "%PORTABLE_DIR%\Blockcode.bat"
echo start "" "Blockcode.exe" >> "%PORTABLE_DIR%\Blockcode.bat"

REM Create README
echo Blockcode Portable v1.0.13 > "%PORTABLE_DIR%\README.txt"
echo. >> "%PORTABLE_DIR%\README.txt"
echo OFFLINE VERSION - No installation required! >> "%PORTABLE_DIR%\README.txt"
echo. >> "%PORTABLE_DIR%\README.txt"
echo To run: >> "%PORTABLE_DIR%\README.txt"
echo 1. Extract this folder anywhere >> "%PORTABLE_DIR%\README.txt"
echo 2. Double-click Blockcode.bat >> "%PORTABLE_DIR%\README.txt"
echo. >> "%PORTABLE_DIR%\README.txt"
echo Drivers: >> "%PORTABLE_DIR%\README.txt"
echo - Run Blockcode\resources\drivers\ch340\CH341SER.EXE (once) >> "%PORTABLE_DIR%\README.txt"
echo - Run: pnputil /add-driver Blockcode\resources\drivers\silabser.inf /install >> "%PORTABLE_DIR%\README.txt"

echo.
echo ========================================
echo  SUCCESS!
echo ========================================
echo.
echo Portable version created in: %PORTABLE_DIR%
echo.
echo Now compress this folder with Windows built-in ZIP:
echo 1. Right-click on: %PORTABLE_DIR%
echo 2. Send to ^> Compressed (zipped) folder
echo 3. Rename to: Blockcode.Portable.1.0.13.zip
echo.
echo Users can extract and run without installation!
echo.
pause
