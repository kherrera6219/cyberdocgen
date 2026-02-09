# Microsoft Store Submission - Quick Checklist
**Date:** January 20, 2026
**Target:** Submit to Microsoft Store Tonight

---

## ✅ COMPLETED (Ready Now)

- [x] Electron wrapper implementation (`electron/main.ts`, `electron/preload.ts`)
- [x] MSIX packaging configuration (`electron-builder.yml`)
- [x] Store flag enabled (`store: true`)
- [x] WACK validation script passing
- [x] Build script configured (`npm run build:msix`)
- [x] Package.json main entry correct (`dist/electron/main.js`)
- [x] Security settings configured (contextIsolation, nodeIntegration)

---

## 🔴 CRITICAL - Required Tonight

### 1. Application Icons (BLOCKER) 🔴
**Status:** ❌ Current favicon.ico is 0 bytes
**Required:** Professional multi-resolution icon

**Quick Fix (30-60 minutes):**
```bash
# Option A: Use existing branding/logo
# 1. Get your company logo (PNG, SVG, or high-res format)
# 2. Use online converter: https://cloudconvert.com/png-to-ico
# 3. Generate multi-resolution ICO (16x16 to 512x512)
# 4. Save to: build/icon.ico

# Option B: Use placeholder (temporary)
# 1. Download a generic document/compliance icon
# 2. Convert to ICO format
# 3. Note: Replace with real branding before public launch
```

**Update Config:**
```yaml
# In electron-builder.yml, change line 13:
win:
  icon: build/icon.ico  # Change from public/favicon.ico
```

---

### 2. Microsoft Partner Center Setup (BLOCKER) 🔴
**Status:** ❌ Need account and app reservation
**Time:** 30-60 minutes
**Cost:** $19 (individual) or $99 (company) one-time fee

**Steps:**
1. Go to https://partner.microsoft.com/dashboard
2. Create account / Sign in with Microsoft account
3. Pay registration fee ($19 or $99)
4. Navigate to "Apps and games" → "New product"
5. Select "MSIX or PWA app"
6. Reserve name: **CyberDocGen**
7. Go to "Product identity" and copy:
   - Package identity name → `identityName` in electron-builder.yml
   - Publisher → `publisher` in electron-builder.yml
   - Publisher display name → `publisherDisplayName` in electron-builder.yml

**Update electron-builder.yml:**
```yaml
msix:
  identityName: [FROM PARTNER CENTER]
  publisher: [FROM PARTNER CENTER]
  publisherDisplayName: [FROM PARTNER CENTER]
```

---

### 3. Backend Deployment (BLOCKER) 🔴
**Status:** ⚠️ Verify production deployment is running
**Required:** Cloud backend must be accessible

**Verify:**
```bash
# Test backend is running
curl https://your-production-url.com/health

# Expected: {"status": "healthy"}
```

**If not deployed:**
```bash
# Deploy to Replit or cloud provider
npm run build
npm start

# Verify health endpoint
# Verify database connection
# Verify AI services configured
```

---

## 🟡 HIGH PRIORITY - Complete Tonight

### 4. Store Listing Content 🟡
**Time:** 30-45 minutes

**Required Fields:**
- [ ] **App Description** (200-10,000 chars) - See MICROSOFT_STORE_SUBMISSION_GUIDE.md
- [ ] **Privacy Policy URL** - Must be publicly accessible HTTPS URL
- [ ] **App Category** - Productivity → Business
- [ ] **Age Rating** - Complete IARC questionnaire
- [ ] **Pricing** - Free or Paid (recommend: Free with cloud subscription)

---

### 5. Screenshots 🟡
**Required:** Minimum 1, Recommended 4-5
**Resolution:** 1920 x 1080 pixels (PNG or JPG)
**Time:** 30-45 minutes

**Capture These Views:**
1. Dashboard / Home screen
2. Document generation in action
3. Gap analysis results
4. Compliance framework view
5. AI chat assistant

**Quick Method:**
```bash
# Run the app locally
npm run dev

# Use Windows Snipping Tool (Win + Shift + S)
# Or Snip & Sketch app
# Save as PNG, 1920x1080
```

---

### 6. Build MSIX Package 🟡
**Time:** 15-30 minutes

**After completing icons and config updates:**
```bash
# Clean previous builds
rm -rf dist/packaging

# Build MSIX package
npm run build:msix

# Expected output:
# dist/packaging/CyberDocGen-<version>.msix
```

**Validate:**
```bash
# Run WACK validation
npx tsx scripts/validate-wack.ts

# All checks should pass ✓
```

---

### 7. Test Account for Reviewers 🟡
**Time:** 15 minutes

**Create:**
- [ ] Test user account with sample data
- [ ] Document credentials securely
- [ ] Verify all features work with test account
- [ ] Prepare backend URL for testing

**Include in Submission Notes:**
```
Test Account:
Username: reviewer@cyberdocgen.com
Password: [Secure password]
Backend URL: https://your-production-url.com

Note: AI features require API keys. Default keys are pre-configured for testing.
```

---

## 🟢 OPTIONAL - Can Complete Later

### 8. Code Signing Certificate 🟢
**Status:** ⚠️ Optional - Microsoft Store handles this automatically
**Only needed if:** Distributing outside Microsoft Store

---

### 9. Marketing Assets 🟢
- [ ] App logo/banner (1240 x 600 px)
- [ ] Promotional images
- [ ] Video trailer (optional)

---

## 🚀 Submission Process (30 minutes)

Once all critical items complete:

1. **Upload Package** (5 minutes)
   - Log into Partner Center
   - Navigate to your app → "Packages"
   - Upload `dist/packaging/CyberDocGen-<version>.msix`
   - Wait for validation

2. **Complete Store Listing** (15 minutes)
   - Add description
   - Upload screenshots
   - Add privacy policy URL
   - Select category
   - Complete age rating

3. **Configure Pricing** (5 minutes)
   - Set pricing model (Free recommended)
   - Select markets (All markets)

4. **Add Notes for Certification** (3 minutes)
   ```
   This is a Windows client for CyberDocGen cloud service.

   Test Account: reviewer@cyberdocgen.com
   Password: [provided separately]
   Backend URL: https://your-production-url.com

   The app requires internet connection and active backend service.
   All WACK validation tests passed.
   ```

5. **Submit** (2 minutes)
   - Review all sections
   - Click "Submit for certification"
   - Wait for email confirmation

---

## ⏱️ Time Breakdown

| Task | Time | Status |
|------|------|--------|
| Create app icons | 30-60 min | 🔴 Required |
| Partner Center setup | 30-60 min | 🔴 Required |
| Update electron-builder.yml | 5 min | 🔴 Required |
| Verify backend deployment | 10-15 min | 🔴 Required |
| Write store listing | 30-45 min | 🟡 High Priority |
| Capture screenshots | 30-45 min | 🟡 High Priority |
| Build MSIX package | 15-30 min | 🟡 High Priority |
| Create test account | 15 min | 🟡 High Priority |
| Upload and submit | 30 min | Final Step |
| **TOTAL** | **3-5 hours** | |

---

## 📊 Success Criteria

### Tonight's Goal: Package Ready for Submission ✅
- [ ] Icons created and configured
- [ ] Publisher info updated in electron-builder.yml
- [ ] MSIX package built successfully
- [ ] WACK validation passing
- [ ] Screenshots captured
- [ ] Store listing content prepared
- [ ] Test account created
- [ ] Backend verified running

### Submission Goal: In Microsoft Review Queue ✅
- [ ] Package uploaded to Partner Center
- [ ] All store listing fields completed
- [ ] Age rating questionnaire completed
- [ ] Pricing configured
- [ ] Submitted for certification
- [ ] Confirmation email received

### Final Goal: Live in Microsoft Store ✅
- [ ] Certification passed (1-3 business days)
- [ ] App published and searchable
- [ ] Download link working
- [ ] App installs and runs correctly
- [ ] Monitoring downloads and reviews

---

## 🆘 Blockers & Solutions

### If You Don't Have Icons
**Solution 1 (Quick):** Use a placeholder icon from icon libraries
- https://www.iconfinder.com/ (search "compliance" or "document")
- Convert to multi-resolution ICO
- Replace later with real branding

**Solution 2 (Professional):** Hire a designer (Fiverr, Upwork)
- Cost: $25-$100
- Turnaround: 24-48 hours
- Get source files for future use

### If Backend Not Deployed
**Quick Deploy to Replit:**
```bash
# Push to Replit
git push replit main

# Or deploy to another platform
# Render, Railway, Heroku, etc.
```

### If No Privacy Policy
**Quick Solution:**
- Use privacy policy generator (https://www.privacypolicygenerator.info/)
- Host on GitHub Pages or company website
- Must be HTTPS and publicly accessible

### If Partner Center Account Delayed
- Account creation is usually instant
- Registration fee processing: 1-2 hours
- If delayed, continue preparing assets

---

## 📞 Support Resources

**Microsoft Partner Support:**
- https://partner.microsoft.com/support
- Live chat available during business hours
- Email support for non-urgent issues

**Electron Builder Issues:**
- https://github.com/electron-userland/electron-builder/issues
- Discord: https://discord.electron.build/

**CyberDocGen Documentation:**
- See: `MICROSOFT_STORE_SUBMISSION_GUIDE.md` (comprehensive guide)
- See: `docs/DEPLOYMENT.md` (backend deployment)

---

**Next Step:** Start with creating application icons (biggest blocker)

**Timeline:**
- Tonight: 3-5 hours to prepare and submit
- Microsoft Review: 1-3 business days
- Live in Store: 3-5 days total

---

**Last Updated:** January 20, 2026
**Version:** 1.0
