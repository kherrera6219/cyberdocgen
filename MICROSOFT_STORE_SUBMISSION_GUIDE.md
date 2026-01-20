# Microsoft Store Submission Guide - CyberDocGen
**Created:** January 20, 2026
**Version:** 2.3.0
**Target:** Windows 11 (x64)
**Package Type:** MSIX

---

## 📋 Pre-Submission Status

### ✅ Completed Requirements
- [x] **Electron Wrapper** - Web application wrapper for Windows
- [x] **MSIX Configuration** - `electron-builder.yml` configured for Microsoft Store
- [x] **WACK Validation** - Windows App Certification Kit pre-validation passed
- [x] **Store Flag Enabled** - `store: true` in electron-builder.yml
- [x] **Package.json Configuration** - Correct Electron main entry point
- [x] **Security Settings** - `nodeIntegration: false`, `contextIsolation: true`

### ⚠️ Required Before Submission
- [ ] **Application Icons** - Professional app icons required (current favicon.ico is 0 bytes)
- [ ] **Code Signing Certificate** - Required for Microsoft Store submission
- [ ] **Microsoft Partner Center Account** - Developer account with app reservation
- [ ] **Backend Server Deployment** - Application requires running backend (cloud-based)

---

## 🎯 Application Type

**Current Configuration:** Web Wrapper (Cloud-Dependent)

**What This Means:**
- ✅ Native Windows 11 application experience
- ✅ Installable via Microsoft Store
- ✅ Full feature set from web application
- ❌ Requires internet connection
- ❌ Requires backend server running (Replit/Cloud deployment)
- ❌ Not a true offline desktop application

**Future Enhancement:** Full local mode with SQLite database (Sprints 1-3, estimated 4-7 weeks)

---

## 📦 Build Process

### Step 1: Prepare Assets

#### Application Icons (CRITICAL)
You need to provide application icons in the following sizes:

**Required Icons:**
- `build/icon.ico` - Windows ICO format containing:
  - 16x16 pixels
  - 32x32 pixels
  - 48x48 pixels
  - 64x64 pixels
  - 128x128 pixels
  - 256x256 pixels
  - 512x512 pixels

**Create Icons:**
```bash
# Option 1: Use an online tool
# - Upload your logo to https://cloudconvert.com/png-to-ico
# - Select "Create multi-resolution icon"
# - Download and save to build/icon.ico

# Option 2: Use ImageMagick (if installed)
convert -background transparent logo.png -define icon:auto-resize=256,128,64,48,32,16 build/icon.ico
```

**Update electron-builder.yml:**
```yaml
win:
  target:
    - msix
  icon: build/icon.ico  # Change from public/favicon.ico
```

### Step 2: Update Publisher Information

Edit `electron-builder.yml` with your actual Microsoft Store publisher details:

```yaml
msix:
  identityName: YourCompany.CyberDocGen
  publisher: CN=Your Publisher Name
  publisherDisplayName: Your Company Name
  applicationId: CyberDocGen
```

**How to Find Your Publisher Details:**
1. Log into [Microsoft Partner Center](https://partner.microsoft.com/dashboard)
2. Go to "Apps and games" → "New product" → "MSIX or PWA app"
3. Reserve your app name "CyberDocGen"
4. Navigate to "Product identity" to find:
   - **Package/Identity/Name** (use for `identityName`)
   - **Package/Identity/Publisher** (use for `publisher`)
   - **Package/Properties/PublisherDisplayName** (use for `publisherDisplayName`)

### Step 3: Build MSIX Package

```bash
# Install dependencies (if not already done)
npm install

# Build the application and create MSIX package
npm run build:msix
```

**Expected Output:**
```
✔ Building MSIX package
✔ Packaging application
✔ Creating MSIX bundle
✔ Output: dist/packaging/CyberDocGen-2.0.1.msix
```

**Build Artifacts:**
- `dist/packaging/CyberDocGen-2.0.1.msix` - Microsoft Store package

### Step 4: Code Signing (REQUIRED)

**Option A: Using Microsoft Partner Center (Recommended)**
- Microsoft Store automatically signs packages during submission
- No manual code signing needed
- Upload unsigned MSIX package directly

**Option B: Manual Code Signing (Optional)**
If you want to test locally before submission:

```bash
# Requires Windows SDK and code signing certificate
SignTool sign /fd SHA256 /a /f YourCertificate.pfx /p CertPassword dist/packaging/CyberDocGen-2.0.1.msix
```

### Step 5: Validate Package

```bash
# Run WACK validation
npx tsx scripts/validate-wack.ts

# Expected output:
# ✓ electron-builder.yml found
# ✓ MSIX target configured
# ✓ MSIX Identity and Publisher configured
# ✓ Electron dependency found
# ✓ Package.json "main" points to Electron entry
# ✓ App icons found
# ✓ WACK Pre-certification Validation Passed!
```

**Windows App Certification Kit (WACK) Testing:**
On a Windows 11 machine with Windows SDK:
```powershell
# Run WACK on the MSIX package
appcert.exe test -apptype msix -appxpackagepath "CyberDocGen-2.0.1.msix" -reportoutputpath "wack_report.xml"
```

---

## 🚀 Microsoft Store Submission

### Prerequisites
1. **Microsoft Partner Center Account** - https://partner.microsoft.com/dashboard
2. **One-time registration fee** - $19 USD (individual) or $99 USD (company)
3. **Backend server deployed** - Application requires running backend

### Submission Steps

#### 1. Create App Listing
1. Log into [Microsoft Partner Center](https://partner.microsoft.com/dashboard)
2. Navigate to "Apps and games" → "New product"
3. Select "MSIX or PWA app"
4. Enter product name: **CyberDocGen**
5. Reserve the name

#### 2. Configure Product Identity
1. Go to "Product management" → "Product identity"
2. Copy the following values to `electron-builder.yml`:
   - Package identity name
   - Publisher name
   - Publisher display name

#### 3. Prepare Store Listing

**Required Information:**

**Description (200-10,000 characters):**
```
CyberDocGen is an enterprise-grade AI-powered compliance management platform that automates compliance documentation, gap analysis, and risk assessment across multiple regulatory frameworks.

KEY FEATURES:
• AI-Powered Document Generation - Leverages GPT-5.1, Claude Opus 4.5, and Gemini 3.0 Pro
• Multi-Framework Support - ISO 27001:2022, SOC 2, FedRAMP, NIST 800-53 Rev 5
• Automated Gap Analysis - Identifies missing controls and compliance gaps
• Risk Assessment - Automated organizational risk analysis with maturity scoring
• Evidence Management - Centralized evidence collection and control mapping
• Enterprise Features - Multi-tenant, RBAC, Microsoft Entra ID SSO, MFA

SUPPORTED FRAMEWORKS:
✓ ISO 27001:2022 - Information security management
✓ SOC 2 Type I & II - Service organization controls
✓ FedRAMP (Low/Moderate/High) - Federal compliance requirements
✓ NIST 800-53 Rev 5 - Security and privacy controls

SECURITY:
• AES-256 encryption at rest
• TLS 1.3 in transit
• Multi-factor authentication (MFA)
• Immutable audit trails
• Real-time threat detection
• Microsoft Entra ID integration

REQUIREMENTS:
• Internet connection required
• Windows 11 Professional or Enterprise (x64)
• Valid subscription to CyberDocGen cloud service
• AI API keys (OpenAI, Anthropic, or Google AI)

Note: This is a Windows client for CyberDocGen cloud service. A valid account and subscription are required.
```

**App Screenshots (Required: 1-10 images):**
- Minimum resolution: 1366 x 768 pixels
- Recommended: 1920 x 1080 pixels
- Format: PNG or JPG
- Capture key features:
  - Dashboard
  - Document generation
  - Gap analysis
  - Compliance frameworks
  - AI chat assistant
  - Settings

**Privacy Policy URL (Required):**
- Must be publicly accessible
- Example: `https://cyberdocgen.com/privacy-policy`

**Category (Select one):**
- **Productivity** → **Business** (Recommended)
- Alternative: **Developer tools** → **Other**

**Age Rating:**
- **IARC Rating Required** - Complete age rating questionnaire
- Expected: **Everyone** or **Teen** (no mature content)

**System Requirements:**
```
Minimum:
• OS: Windows 11 version 22000 or higher
• Architecture: x64
• Memory: 4 GB RAM
• Disk Space: 500 MB available

Recommended:
• OS: Windows 11 Professional/Enterprise (latest)
• Architecture: x64
• Memory: 8 GB RAM
• Disk Space: 1 GB available
• Internet: Broadband connection (required)
```

#### 4. Upload Package
1. Go to "Packages" → "Upload MSIX package"
2. Upload `dist/packaging/CyberDocGen-2.0.1.msix`
3. Wait for automatic validation
4. Review package details:
   - Version: 2.0.1
   - Supported architectures: x64
   - Capabilities: internetClient, privateNetworkClientServer

#### 5. Pricing and Availability
**Options:**
- **Free** - If offering trial/freemium model
- **Paid** - Set price (e.g., $29.99/month, $299.99/year)
- **Free Trial** - Offer trial period before subscription

**Recommended for CyberDocGen:**
- Free download (requires separate cloud subscription)
- Or: Include subscription tier in Microsoft Store

**Markets:**
- Select "All markets" or specific regions
- Consider compliance requirements per region

#### 6. Properties
- **Category:** Productivity → Business
- **Subcategory:** Document management, Compliance
- **App declarations:**
  - [ ] Uses cryptography: Yes
  - [ ] Requires privacy policy: Yes
  - [ ] Requires internet: Yes

#### 7. Submission Options
**Release Options:**
- **Manual publish** - Review after certification before going live
- **Automatic publish** - Go live immediately after certification

**Notes for Certification:**
```
This application is a Windows client for CyberDocGen cloud service.

IMPORTANT TESTING NOTES:
1. Backend Requirement: The application requires an active connection to our cloud backend service
2. Test Account: Please contact [your-email@domain.com] for test credentials
3. First Launch: Users must configure their cloud backend URL in settings
4. AI Features: Require valid API keys for OpenAI, Anthropic, or Google AI

The application has been tested on:
• Windows 11 Professional (x64) version 22H2
• Clean install and upgrade scenarios
• Multiple user accounts
• Network connectivity scenarios

All WACK validation tests have passed successfully.
```

#### 8. Submit for Certification

1. Review all sections for completeness
2. Click "Submit for certification"
3. Wait for Microsoft review (typically 1-3 business days)

**Certification Process:**
- **Automated testing** - WACK compliance, malware scan, performance
- **Manual review** - App functionality, metadata accuracy, policy compliance
- **Notification** - Email when certification completes or issues found

---

## 📊 Post-Submission Monitoring

### Certification Status
Track submission status in Partner Center:
- **In progress** - Under review
- **Passed** - Certification complete
- **Failed** - Issues found (review feedback)

### Common Rejection Reasons
1. **Missing or incorrect metadata** - Screenshots, description
2. **App crashes or doesn't launch** - Requires backend URL configuration
3. **Privacy policy issues** - Missing or inaccessible URL
4. **Icon/branding issues** - Low quality or trademarked images
5. **Functional issues** - Features not working as described

### After Approval
1. **Monitor downloads** - Analytics in Partner Center
2. **Respond to reviews** - Customer feedback and ratings
3. **Plan updates** - Regular updates with new features
4. **Track metrics:**
   - Download count
   - Active users
   - Crash reports
   - User ratings and reviews

---

## 🔄 Update Process

### Releasing Updates

**When to Update:**
- Bug fixes
- New features
- Security patches
- Performance improvements

**Update Steps:**
1. Update version in `package.json`:
   ```json
   {
     "version": "2.0.2"
   }
   ```

2. Rebuild MSIX package:
   ```bash
   npm run build:msix
   ```

3. Submit to Partner Center:
   - Go to app → "Packages"
   - Upload new MSIX
   - Add release notes
   - Submit for certification

4. Users receive automatic updates via Microsoft Store

---

## 🛠️ Troubleshooting

### Build Errors

**Error: "Icon file not found"**
```bash
# Solution: Create icon file
cp path/to/your/logo.ico build/icon.ico
```

**Error: "Publisher mismatch"**
```bash
# Solution: Update electron-builder.yml with correct publisher details from Partner Center
```

**Error: "MSIX validation failed"**
```bash
# Solution: Run WACK validation to identify specific issues
npx tsx scripts/validate-wack.ts
```

### Submission Errors

**"App requires internet but not declared"**
- Solution: Enable "internetClient" capability (already configured)

**"Privacy policy URL unreachable"**
- Solution: Ensure privacy policy URL is publicly accessible (HTTPS)

**"App crashes on launch"**
- Solution: Ensure backend server is running and accessible
- Provide test account to Microsoft reviewers

### Runtime Issues

**"Cannot connect to backend"**
- User needs to configure backend URL in settings
- Ensure cloud deployment is running (Replit/production)

**"Features not working"**
- User needs valid AI API keys
- Check internet connectivity

---

## 📋 Pre-Submission Checklist

### Required Before Tonight's Submission

- [ ] **Application Icons Created**
  - [ ] Professional logo designed
  - [ ] Multi-resolution .ico file created (16x16 to 512x512)
  - [ ] Icon placed in `build/icon.ico`
  - [ ] electron-builder.yml updated to reference new icon

- [ ] **Publisher Information Updated**
  - [ ] Microsoft Partner Center account created
  - [ ] App name "CyberDocGen" reserved
  - [ ] Package identity name copied to electron-builder.yml
  - [ ] Publisher name copied to electron-builder.yml
  - [ ] Publisher display name copied to electron-builder.yml

- [ ] **Backend Deployment**
  - [ ] Production backend deployed and accessible
  - [ ] Database migrations completed
  - [ ] Environment variables configured
  - [ ] Health checks passing
  - [ ] Test account created for Microsoft reviewers

- [ ] **Store Listing Prepared**
  - [ ] App description written (200-10,000 characters)
  - [ ] Screenshots captured (minimum 1, recommended 4-5)
  - [ ] Privacy policy URL available and accessible
  - [ ] Age rating questionnaire completed
  - [ ] Categories selected
  - [ ] Pricing/availability configured

- [ ] **Package Built and Tested**
  - [ ] MSIX package built successfully
  - [ ] WACK validation passed
  - [ ] Tested on Windows 11 machine
  - [ ] All features working correctly
  - [ ] Code signing completed (if manual)

- [ ] **Documentation Ready**
  - [ ] Testing notes for Microsoft reviewers
  - [ ] Test account credentials prepared
  - [ ] Backend URL for testing
  - [ ] Known limitations documented

---

## ⏱️ Estimated Timeline

### Tonight (Preparation): 2-4 hours
- [ ] Create application icons (30-60 min)
- [ ] Update electron-builder.yml (15 min)
- [ ] Build MSIX package (15-30 min)
- [ ] Prepare screenshots (30-45 min)
- [ ] Write store listing content (30-45 min)
- [ ] Complete Partner Center setup (30-60 min)

### Submission: 30 minutes
- [ ] Upload package
- [ ] Fill out store listing
- [ ] Submit for review

### Microsoft Review: 1-3 business days
- Automated testing
- Manual review
- Certification decision

### Total: 3-5 days to live in Microsoft Store

---

## 🔗 Resources

**Microsoft Documentation:**
- [Partner Center Dashboard](https://partner.microsoft.com/dashboard)
- [MSIX Packaging Documentation](https://docs.microsoft.com/en-us/windows/msix/)
- [Windows App Certification Kit](https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/)
- [Microsoft Store Policies](https://docs.microsoft.com/en-us/windows/apps/publish/store-policies)

**Tools:**
- [Electron Builder](https://www.electron.build/)
- [Icon Converter](https://cloudconvert.com/png-to-ico)
- [Screenshot Tool](https://www.microsoft.com/en-us/p/snip-sketch/)

**Support:**
- [Microsoft Partner Support](https://partner.microsoft.com/support)
- [Electron Builder Issues](https://github.com/electron-userland/electron-builder/issues)

---

## 📝 Notes

**Important Considerations:**

1. **Backend Dependency:** This Windows app is a wrapper for the web application and requires:
   - Active internet connection
   - Running backend server (cloud deployment)
   - Valid user account and subscription

2. **Future Roadmap:** Full local mode with SQLite database
   - Sprint 1: Local mode foundation (2-3 weeks)
   - Sprint 2: Desktop integration (1-2 weeks)
   - Sprint 3: Windows integration (1-2 weeks)
   - Total: 4-7 weeks for true offline desktop app

3. **Code Signing:** Microsoft Store handles code signing automatically during submission. Manual signing only needed for external distribution.

4. **Testing:** Create a test account with sample data for Microsoft reviewers to test all features.

---

**Last Updated:** January 20, 2026
**Document Version:** 1.0
**Application Version:** 2.3.0
