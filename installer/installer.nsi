; NSIS Script for Skyrover IDE - Offline Installer
; Handles large files (600MB+) better than Inno Setup
; Build with: makensis installer\installer.nsi

!define PRODUCT_NAME "Skyrover"
!define PRODUCT_VERSION "1.0.14"
!define PRODUCT_PUBLISHER "Skyrover.ai"
!define PRODUCT_EXE "Skyrover.ai.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"

; Modern UI
!include "MUI2.nsh"

; Settings
Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "..\dist-electron\installer\Skyrover.ai.Setup.${PRODUCT_VERSION}.exe"
InstallDir "$PROGRAMFILES64\Skyrover.ai"
InstallDirRegKey HKLM "${PRODUCT_UNINST_KEY}" "InstallLocation"
RequestExecutionLevel admin

; Compression - LZMA is excellent for large files
SetCompressor /SOLID lzma
SetCompressorDictSize 32

; Modern UI Configuration
!define MUI_ABORTWARNING
!define MUI_ICON "..\ico\favicon.ico"
!define MUI_UNICON "..\ico\favicon.ico"

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "..\LICENSE"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN "$INSTDIR\${PRODUCT_EXE}"
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

; Installer Section
Section "MainSection" SEC01
  SetOutPath "$INSTDIR"
  SetOverwrite on
  
  ; Copy all files from win-unpacked
  File /r "..\dist-electron\win-unpacked\*.*"
  
  ; Create shortcuts
  CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_EXE}"
  CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\${PRODUCT_EXE}"
  
  ; Install drivers
  DetailPrint "Installing CH340 Drivers..."
  ExecWait '"$INSTDIR\resources\drivers\ch340\CH341SER.EXE" /S'
  
  DetailPrint "Installing CP210x Drivers..."
  ExecWait 'pnputil.exe /add-driver "$INSTDIR\resources\drivers\silabser.inf" /install'
  
SectionEnd

; Post-install
Section -Post
  WriteUninstaller "$INSTDIR\uninst.exe"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\${PRODUCT_EXE}"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "InstallLocation" "$INSTDIR"
SectionEnd

; Uninstaller
Section Uninstall
  ; Remove shortcuts
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk"
  RMDir "$SMPROGRAMS\${PRODUCT_NAME}"
  
  ; Remove files
  RMDir /r "$INSTDIR"
  
  ; Clean up AppData cores (but preserve user data)
  RMDir /r "$LOCALAPPDATA\Skyrover.ai\arduino_ide_cores"
  
  ; Remove registry keys
  DeleteRegKey HKLM "${PRODUCT_UNINST_KEY}"
SectionEnd
