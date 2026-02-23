!include "FileFunc.nsh"
!include "${PROJECT_DIR}\uninstaller.nsh"

!macro customInstall
  ; Keep the standard NSIS assisted installer UX:
  ; - install location chooser (oneClick=false + allowToChangeInstallationDirectory=true)
  ; - Windows progress page during file copy
  DetailPrint "Standard installer wizard enabled: directory chooser + install progress page"

  ; Show an explicit completion notification for interactive installs.
  IfSilent skip_install_message
  MessageBox MB_OK|MB_ICONINFORMATION "CyberDocGen installation is complete.$\n$\nInstall location:$\n$INSTDIR$\n$\nNext step: open CyberDocGen and configure your AI provider API key(s) in Settings -> AI API Keys."
skip_install_message:
!macroend
