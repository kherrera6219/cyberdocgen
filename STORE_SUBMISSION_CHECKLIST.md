# Microsoft Store Submission Checklist

**Version:** 2.4.0  
**Last Updated:** February 15, 2026

## Identity and Account

- [ ] Partner Center account active
- [ ] App name reserved in Partner Center
- [ ] Product identity values captured:
  - [ ] `WINDOWS_STORE_IDENTITY_NAME`
  - [ ] `WINDOWS_STORE_PUBLISHER` (`CN=...`)
  - [ ] `WINDOWS_STORE_PUBLISHER_DISPLAY_NAME`

## Build Validation

- [ ] Set Store env vars in shell
- [ ] Run `npm run windows:validate:store`
- [ ] Validation passes with zero errors

## Build Artifacts

- [ ] Run `npm run build:store`
- [ ] Verify `dist/packaging/CyberDocGen-Store-<version>.appx`

## Runtime Compliance

- [ ] Confirm Store runtime guard exists (`process.windowsStore` logic)
- [ ] Confirm auto-updater is disabled for Store builds

## Store Listing Metadata

- [ ] App description prepared
- [ ] Privacy policy URL published and reachable (HTTPS)
- [ ] Screenshots uploaded (Windows desktop)
- [ ] Category and age rating completed
- [ ] Pricing/availability configured

## Submission

- [ ] Upload APPX package in Partner Center
- [ ] Review package identity matches Partner Center values
- [ ] Submit for certification

## Optional Win32 EXE Checklist (if using EXE ingestion)

- [ ] Run `npm run windows:validate`
- [ ] Verify root NSIS scripts exist: `installer.nsh`, `uninstaller.nsh`
- [ ] Run `npm run build:win`
- [ ] Verify `dist/packaging/CyberDocGen-Setup-<version>.exe`
- [ ] Verify silent install command: `CyberDocGen-Setup-<version>.exe /S`
- [ ] Verify silent uninstall command: `"Uninstall CyberDocGen.exe" /S`
