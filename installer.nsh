!include "FileFunc.nsh"
!include "${PROJECT_DIR}\uninstaller.nsh"

!macro customInstall
  ; Installation progress is shown by default on the NSIS "Installing" page.
  ; Show an explicit completion notification for interactive installs.
  IfSilent skip_install_message
  MessageBox MB_OK|MB_ICONINFORMATION "CyberDocGen installation is complete.$\n$\nNext step: open CyberDocGen and configure your AI provider API key(s) in Settings -> AI API Keys."
skip_install_message:
!macroend
