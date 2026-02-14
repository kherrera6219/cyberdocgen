!include "FileFunc.nsh"

!macro customInstall
  ; Installation progress is shown by default on the NSIS "Installing" page.
  ; Show an explicit completion notification for interactive installs.
  IfSilent skip_install_message
  MessageBox MB_OK|MB_ICONINFORMATION "CyberDocGen installation is complete.$\n$\nNext step: open CyberDocGen and configure your AI provider API key(s) in Settings -> AI API Keys."
skip_install_message:
!macroend

!macro customUnInstall
  ; Attempt to stop any running app process tree before removing files.
  nsExec::ExecToLog 'taskkill /F /T /IM CyberDocGen.exe'
  Pop $0
  nsExec::ExecToLog 'taskkill /F /T /IM cyberdocgen.exe'
  Pop $0

  ; Support unattended full cleanup with:
  ; "Uninstall CyberDocGen.exe" /S /REMOVEALLDATA
  ${GetParameters} $R0
  ${GetOptions} $R0 "/REMOVEALLDATA" $R1
  IfErrors +2 0
    Goto remove_data

  ; Show a message box to ask the user if they want to delete their data
  IfSilent keep_data
  MessageBox MB_YESNO|MB_ICONQUESTION "Do you want to completely remove all CyberDocGen application data (database, documents, and settings)?$\n$\nSelect 'Yes' to remove everything, or 'No' to keep your data for future use." /SD IDNO IDYES remove_data

keep_data:
  DetailPrint "Kept application data in $APPDATA\CyberDocGen for future use"
  Goto uninstall_complete

remove_data:
  RMDir /r "$APPDATA\CyberDocGen"
  RMDir /r "$LOCALAPPDATA\CyberDocGen"
  ; Remove any Credential Manager target that contains CyberDocGen.
  ; This handles known keys and future provider keys without script changes.
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -Command "$$targets = cmdkey /list | Select-String ''Target:'' | ForEach-Object { ($$_ -replace ''^\s*Target:\s*'', '''').Trim() } | Where-Object { $$_ -like ''*CyberDocGen*'' }; foreach ($$target in $$targets) { cmdkey /delete:$$target | Out-Null }"'
  Pop $0
  DetailPrint "Removed application data from $APPDATA\CyberDocGen and $LOCALAPPDATA\CyberDocGen"

uninstall_complete:
  ; Uninstall progress is shown by default on the NSIS "Uninstalling" page.
  ; Show an explicit completion notification for interactive uninstalls.
  IfSilent skip_uninstall_message
  MessageBox MB_OK|MB_ICONINFORMATION "CyberDocGen has been uninstalled successfully."
skip_uninstall_message:
!macroend
