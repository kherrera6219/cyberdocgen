!include "FileFunc.nsh"
!include "${PROJECT_DIR}\uninstaller.nsh"

!macro customInstall
  ; Keep the standard NSIS assisted installer UX:
  ; - install location chooser (oneClick=false + allowToChangeInstallationDirectory=true)
  ; - Windows progress page during file copy
  DetailPrint "Standard installer wizard enabled: directory chooser + install progress page"

  IfSilent skip_install_message
  MessageBox MB_OK "Installation is complete."
skip_install_message:
!macroend
