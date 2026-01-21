# CyberDocGen Local Mode User Guide

**Version 3.0.0** | Windows 11 Desktop Application

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Features](#features)
- [API Key Management](#api-key-management)
- [Database Management](#database-management)
- [Storage Management](#storage-management)
- [Desktop Features](#desktop-features)
- [Settings & Configuration](#settings--configuration)
- [Updates](#updates)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## Introduction

### What is Local Mode?

CyberDocGen Local Mode is a **standalone Windows desktop application** that runs entirely on your computer. Unlike cloud-based compliance platforms, Local Mode:

- ✅ **Works Offline** - No internet required after initial setup
- ✅ **Data Privacy** - All data stays on your computer
- ✅ **Secure Storage** - Uses Windows Credential Manager for API keys
- ✅ **No Subscriptions** - One-time purchase, no monthly fees
- ✅ **Fast Performance** - Local database and storage
- ✅ **Full Control** - Backup, restore, and manage your data

### Who Should Use Local Mode?

**Ideal For**:
- Individual compliance consultants
- Contractors working on sensitive projects
- Organizations with strict data residency requirements
- Users in air-gapped or restricted networks
- Anyone who wants full data sovereignty

**Not Recommended For**:
- Teams requiring real-time collaboration
- Organizations needing centralized data management
- Users requiring multi-device synchronization

### System Requirements

**Minimum Requirements**:
- Windows 11 (64-bit)
- 4 GB RAM
- 500 MB free disk space (plus space for your documents)
- Screen resolution: 1024x768 or higher

**Recommended Requirements**:
- Windows 11 (64-bit), latest updates
- 8 GB RAM or more
- 2 GB free disk space
- Screen resolution: 1920x1080 or higher
- SSD for optimal database performance

---

## Installation

### Method 1: Microsoft Store (Recommended)

1. Open **Microsoft Store** on Windows 11
2. Search for **"CyberDocGen"**
3. Click **"Get"** or **"Install"**
4. Wait for automatic installation
5. Launch from Start Menu

**Benefits**:
- Automatic updates
- Verified and trusted
- Sandboxed security
- Easy uninstall

### Method 2: Direct Download

1. Visit [cyberdocgen.com/download](https://cyberdocgen.com/download)
2. Download **CyberDocGen-Setup-3.0.0.exe**
3. Run the installer
4. Follow the setup wizard:
   - Accept license agreement
   - Choose installation location
   - Select desktop shortcut option
5. Click **Install**
6. Launch from Start Menu or desktop

**Note**: You may see a Windows SmartScreen warning. Click "More info" → "Run anyway" if you trust the source.

### Method 3: Portable Version

For users who prefer not to install:

1. Download **CyberDocGen-3.0.0-win.zip**
2. Extract to a folder (e.g., `C:\Tools\CyberDocGen`)
3. Run `CyberDocGen.exe` from the extracted folder
4. Data will be stored in the application folder

---

## Getting Started

### First Launch

When you launch CyberDocGen for the first time:

1. **Welcome Screen**
   - Introduction to Local Mode features
   - Privacy and data storage information

2. **Initial Setup**
   - Database initialization (automatic)
   - Create your user account
   - Set application preferences

3. **API Key Configuration** (Optional)
   - Configure AI provider keys for AI features
   - See [API Key Management](#api-key-management) section

### Application Layout

```
┌─────────────────────────────────────────────────────┐
│ 💻 Running in Local Mode                            │  ← Mode Banner
├─────────────────────────────────────────────────────┤
│  File  Edit  View  Database  Help                   │  ← Native Menu
├──────────┬──────────────────────────────────────────┤
│          │                                           │
│  Sidebar │           Main Content Area              │
│          │                                           │
│  - Home  │                                           │
│  - Docs  │     Your documents and workflows         │
│  - APIs  │                                           │
│  - Sett. │                                           │
│          │                                           │
└──────────┴──────────────────────────────────────────┘
```

### Quick Start Guide

**Create Your First Document**:

1. Click **File → New Document** (or press `Ctrl+N`)
2. Select compliance framework (ISO 27001, SOC 2, etc.)
3. Choose document type (Policy, Procedure, Control)
4. Fill in document details
5. Click **Save** to store locally

**All your data is stored in**: `%APPDATA%\CyberDocGen\`

---

## Features

### Core Features (Available Offline)

**Document Management**:
- Create, edit, and organize compliance documents
- Version history and rollback
- Document templates for all frameworks
- Quality scoring and recommendations
- Export to PDF, Word, or Markdown

**Compliance Frameworks**:
- ISO 27001:2022
- SOC 2 Type I/II
- FedRAMP (Low/Moderate/High)
- NIST 800-53 Rev 5

**Local Database**:
- Fast SQLite database
- Automatic indexing
- Full-text search
- Concurrent access (WAL mode)

**File Storage**:
- Local filesystem storage
- Content-addressable (deduplicated)
- Supports all file types
- Efficient storage management

### AI Features (Requires Internet + API Keys)

**Document Generation**:
- AI-powered compliance document generation
- Framework-specific templates
- Custom control documentation

**Document Analysis**:
- Quality assessment and scoring
- Compliance gap analysis
- Risk assessment
- Recommendations and improvements

**Compliance Assistant**:
- Interactive Q&A chatbot
- Framework guidance
- Best practices advice

**Supported AI Providers**:
- **OpenAI** (GPT-4, GPT-3.5)
- **Anthropic** (Claude)
- **Google AI** (Gemini)

*Note: AI features require active internet connection and API keys.*

---

## API Key Management

### Why API Keys Are Needed

AI features require API keys from AI providers. Your keys are:
- Stored securely in **Windows Credential Manager**
- Encrypted with your Windows login credentials
- Never leave your computer
- Inaccessible to other users on the same computer

### Adding API Keys

1. **Open API Keys Page**:
   - Navigate to **Settings → API Keys**
   - Or use menu: **Help → API Keys**

2. **Configure Provider**:

   **For OpenAI**:
   - Click **OpenAI** card
   - Enter API key (starts with `sk-...`)
   - Click **Test** to verify
   - Click **Save**

   **For Anthropic**:
   - Click **Anthropic** card
   - Enter API key (starts with `sk-ant-...`)
   - Click **Test** to verify
   - Click **Save**

   **For Google AI**:
   - Click **Google AI** card
   - Enter API key (starts with `AIza...`)
   - Click **Test** to verify
   - Click **Save**

3. **Verify Configuration**:
   - Green checkmark indicates successful configuration
   - Try using an AI feature to test

### Getting API Keys

**OpenAI**:
1. Visit [platform.openai.com/signup](https://platform.openai.com/signup)
2. Create account or sign in
3. Go to API Keys section
4. Click **Create new secret key**
5. Copy and save your key (you won't see it again!)

**Anthropic**:
1. Visit [console.anthropic.com/signup](https://console.anthropic.com/signup)
2. Create account or sign in
3. Navigate to API Keys
4. Generate new key
5. Copy and save your key

**Google AI**:
1. Visit [makersuite.google.com](https://makersuite.google.com/)
2. Sign in with Google account
3. Get API key from dashboard
4. Copy and save your key

### Managing API Keys

**Update Key**:
1. Go to **Settings → API Keys**
2. Enter new key in the provider card
3. Click **Save**

**Remove Key**:
1. Go to **Settings → API Keys**
2. Click **Remove Key** button on provider card
3. Confirm removal

**View Stored Keys**:
- Open Windows **Control Panel**
- Go to **Credential Manager**
- Select **Windows Credentials**
- Look for entries starting with **CyberDocGen:**

---

## Database Management

### Database Location

Your database is stored at:
```
%APPDATA%\CyberDocGen\cyberdocgen.db
```

Typical path:
```
C:\Users\YourName\AppData\Roaming\CyberDocGen\cyberdocgen.db
```

### Viewing Database Information

1. Navigate to **Settings → Local Settings**
2. View **Database** tab
3. See information:
   - Database path
   - Database size
   - Number of pages
   - WAL mode status
   - Last backup date

### Backup Database

**Manual Backup**:

1. **Using Application Menu**:
   - Click **Database → Backup Database**
   - Choose save location
   - Enter filename (e.g., `backup-2026-01-21.db`)
   - Click **Save**
   - Confirmation message when complete

2. **Using Settings Page**:
   - Go to **Settings → Local Settings → Database**
   - Click **Backup Database**
   - Choose location and filename
   - Click **Save**

**Automated Backups**:
- Scheduled backups coming in future version
- For now, set calendar reminder to backup regularly

**Best Practices**:
- Backup weekly (or before major changes)
- Store backups in multiple locations
- Test restore occasionally
- Name backups with dates (e.g., `backup-2026-01-21.db`)
- Keep at least 3 recent backups

### Restore Database

**⚠️ Warning**: Restoring will replace your current database. Backup first!

1. **Backup Current Database** (recommended):
   - Follow backup steps above
   - Save as `backup-before-restore.db`

2. **Restore from Backup**:
   - Click **Database → Restore Database**
   - Select backup file (`.db` file)
   - Click **Open**
   - Confirm restoration
   - Application will restart automatically

3. **Verify Restoration**:
   - Check that documents are present
   - Verify recent changes
   - Test functionality

### Database Maintenance

**When to Run Maintenance**:
- Database feels slow
- After deleting many documents
- Monthly as routine maintenance
- After large imports/exports

**Run Maintenance**:

1. Go to **Settings → Local Settings → Database**
2. Click **Run Maintenance**
3. Wait for completion (may take 1-5 minutes)
4. See results summary

**What Maintenance Does**:
- **VACUUM**: Reclaims unused space
- **ANALYZE**: Updates query statistics
- **Integrity Check**: Verifies database health
- **Optimize**: Rebuilds indexes

### Database Troubleshooting

**Database Locked Error**:
- Another instance of CyberDocGen is running
- Solution: Close all instances, restart application

**Corrupted Database**:
- Rare, but possible after system crash
- Solution: Restore from most recent backup
- Run integrity check after restore

**Database Too Large**:
- Delete old documents you don't need
- Run maintenance to reclaim space
- Backup and archive old data

---

## Storage Management

### Storage Location

Your files are stored at:
```
%APPDATA%\CyberDocGen\storage\
```

### Viewing Storage Information

1. Go to **Settings → Local Settings → Storage**
2. View statistics:
   - Storage path
   - Total storage size
   - Number of files
   - Breakdown by file type

### Storage Features

**Content-Addressable Storage**:
- Files stored by content hash
- Automatic deduplication
- Efficient use of disk space
- Prevents accidental overwrites

**File Organization**:
```
storage/
├── documents/    # Document files
├── evidence/     # Evidence files
├── exports/      # Generated exports
└── temp/         # Temporary files
```

### Cleanup Storage

**Remove Orphaned Files**:

1. Go to **Settings → Local Settings → Storage**
2. Click **Cleanup Storage**
3. Wait for scan to complete
4. Review items to be removed
5. Click **Confirm Cleanup**
6. See results summary

**What Gets Removed**:
- Orphaned files (no database references)
- Empty directories
- Temporary files older than 7 days
- Incomplete uploads

**Manual Cleanup**:
- Safe to delete `temp/` folder contents
- **DO NOT** delete other folders manually
- Use application's cleanup feature

---

## Desktop Features

### Native Menus

**File Menu**:
- **New Document** (`Ctrl+N`) - Create new document
- **Settings** (`Ctrl+,`) - Open settings
- **Exit** (`Alt+F4`) - Close application

**Edit Menu**:
- Standard clipboard operations
- Undo/Redo support

**View Menu**:
- **Reload** - Refresh current page
- **DevTools** (`Ctrl+Shift+I`) - Developer tools
- **Zoom In/Out** - Adjust UI size
- **Fullscreen** (`F11`) - Toggle fullscreen

**Database Menu**:
- **Backup Database** - Create backup
- **Restore Database** - Restore from backup
- **Database Information** - View database stats

**Help Menu**:
- **Documentation** - Open user guide
- **Report Issue** - Submit bug report
- **About CyberDocGen** - Version information

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New Document |
| `Ctrl+S` | Save Document |
| `Ctrl+,` | Open Settings |
| `Ctrl+F` | Find in Document |
| `Ctrl+Shift+I` | DevTools |
| `F5` | Reload |
| `F11` | Fullscreen |
| `Alt+F4` | Exit Application |

### System Tray

**System Tray Icon**:
- Located in Windows system tray (bottom-right)
- Right-click for quick menu:
  - **Open CyberDocGen** - Show main window
  - **Quit** - Exit application

**Tray Behavior**:
- Click icon to toggle window visibility
- Application continues running when window closed
- Useful for keeping app ready without cluttering taskbar

**Disable System Tray** (if preferred):
- Coming in future version
- For now, tray icon always present

### Window Management

**Window State Persistence**:
- Window size saved automatically
- Window position saved
- Maximized state saved
- Restored on next launch

**Multiple Displays**:
- Window position works with multiple monitors
- If display disconnected, window moves to primary display

---

## Settings & Configuration

### Application Settings

**General Settings**:
- Theme (Light/Dark/System)
- Language (English, more coming)
- Startup behavior
- Notification preferences

**Privacy Settings**:
- Usage analytics (opt-in)
- Crash reporting (opt-in)
- Update checks (recommended)

**Data & Storage**:
- Default save location
- Auto-save interval
- Backup preferences

### Local Mode Information

**View Mode Information**:
1. Go to **Settings → Local Settings → Overview**
2. See:
   - Deployment mode (Local)
   - Data storage location
   - Database type (SQLite)
   - Storage type (Local Filesystem)
   - Application version

**System Information**:
- Windows version
- Application version
- Electron version
- Database version

---

## Updates

### Automatic Updates

CyberDocGen automatically checks for updates:
- On application startup (after 5 seconds)
- Every 4 hours while running
- Downloads updates in background

**Update Process**:

1. **Update Available**:
   - Notification appears
   - Update downloads automatically
   - Download progress shown

2. **Update Downloaded**:
   - Dialog asks: "Restart now or later?"
   - Choose **Restart Now** to install immediately
   - Or choose **Later** to install on next launch

3. **Installation**:
   - Application closes
   - Update installs automatically
   - Application restarts with new version

### Manual Update Check

1. Go to **Help → About CyberDocGen**
2. Click **Check for Updates**
3. Wait for check to complete
4. Follow update process if available

### Update Settings

**Configure Update Behavior**:
- Coming in future version
- For now, updates are automatic

**Disable Updates**:
- Not recommended (miss security fixes)
- Can block update server in firewall if needed

---

## Troubleshooting

### Common Issues

#### Application Won't Start

**Symptoms**: Double-click icon, nothing happens

**Solutions**:
1. Check Task Manager for existing CyberDocGen process
2. End any existing processes
3. Try launching again
4. Restart Windows
5. Reinstall application

#### Database Errors

**Symptoms**: "Database is locked" or "Cannot open database"

**Solutions**:
1. Close all instances of CyberDocGen
2. Check Task Manager for background processes
3. Restart application
4. If persists, restore from backup

#### Slow Performance

**Symptoms**: Application feels sluggish

**Solutions**:
1. Run database maintenance (Settings → Database → Maintenance)
2. Cleanup storage (Settings → Storage → Cleanup)
3. Close unnecessary applications
4. Check disk space (need at least 500 MB free)
5. Restart application

#### API Key Errors

**Symptoms**: "Invalid API key" or "Cannot save API key"

**Solutions**:
1. Verify API key is correct (check copy-paste)
2. Test key on provider's website first
3. Ensure Windows Credential Manager is accessible
4. Try restarting application
5. Use environment variables as fallback

#### Window Issues

**Symptoms**: Window appears off-screen or wrong size

**Solutions**:
1. Press `Windows+Shift+Arrow` to move window
2. Or delete window state file:
   - Navigate to `%APPDATA%\CyberDocGen\`
   - Delete `window-state.json`
   - Restart application

### Getting Help

**Built-in Help**:
- Press `F1` for context-sensitive help
- Go to **Help → Documentation**

**Online Resources**:
- User Guide: [docs.cyberdocgen.com/local-mode](https://docs.cyberdocgen.com/local-mode)
- FAQ: [cyberdocgen.com/faq](https://cyberdocgen.com/faq)
- Video Tutorials: [youtube.com/cyberdocgen](https://youtube.com/cyberdocgen)

**Community Support**:
- Forum: [community.cyberdocgen.com](https://community.cyberdocgen.com)
- Discord: [discord.gg/cyberdocgen](https://discord.gg/cyberdocgen)

**Contact Support**:
- Email: support@cyberdocgen.com
- Response time: Within 24 hours
- Include:
  - Application version
  - Windows version
  - Description of issue
  - Steps to reproduce
  - Screenshots if helpful

### Logging

**Enable Debug Logging**:

1. Close CyberDocGen
2. Set environment variable:
   ```powershell
   $env:DEBUG = "*"
   ```
3. Launch from command line:
   ```powershell
   & "C:\Program Files\CyberDocGen\CyberDocGen.exe"
   ```
4. Logs appear in console

**Log Files**:
```
%APPDATA%\CyberDocGen\logs\
├── app.log        # Application logs
├── database.log   # Database operations
└── error.log      # Error logs
```

---

## FAQ

### General Questions

**Q: Does Local Mode require internet?**

A: No, except for:
- Initial installation/download
- AI features (OpenAI, Anthropic, Google AI)
- Application updates (optional)
- Accessing online documentation

All core compliance features work completely offline.

**Q: Can I use Local Mode on multiple computers?**

A: Yes, but data is not synchronized. Each installation has its own local database. You'll need to manually backup and transfer data if you want to move between computers.

**Q: Is my data backed up automatically?**

A: Not currently. You must manually backup using Database → Backup Database. Scheduled backups are planned for a future version.

**Q: How much does Local Mode cost?**

A: See [cyberdocgen.com/pricing](https://cyberdocgen.com/pricing) for current pricing. Generally a one-time purchase or annual license, no monthly subscription.

### Technical Questions

**Q: What database does Local Mode use?**

A: SQLite 3 with WAL (Write-Ahead Logging) mode for optimal performance and concurrent access.

**Q: Where is my data stored?**

A: All data is stored in `%APPDATA%\CyberDocGen\`:
- Database: `cyberdocgen.db`
- Files: `storage/` folder
- API Keys: Windows Credential Manager
- Settings: `config.json`

**Q: Can I move my data to a different drive?**

A: Not directly supported yet. You would need to:
1. Backup database
2. Copy storage folder
3. Reinstall on new drive
4. Restore backup
5. Reconfigure settings

**Q: Does Local Mode support multiple users?**

A: No, Local Mode is single-user. Each Windows user account gets their own separate database. For multi-user collaboration, use Cloud Mode.

**Q: Can I export data to Cloud Mode?**

A: Not currently. Local Mode and Cloud Mode use the same database schema, but migration tools are not yet available. This is planned for a future version.

### API Key Questions

**Q: Are my API keys safe?**

A: Yes. API keys are stored in Windows Credential Manager, which:
- Encrypts keys with your Windows login password
- Prevents access by other users on the same computer
- Survives application reinstalls
- Is a Windows OS feature (not custom encryption)

**Q: Do I need all three AI providers?**

A: No. You can use any combination:
- Use one provider for all AI features
- Use different providers for different features
- Use no providers (AI features disabled)

**Q: How much do AI API keys cost?**

A: Varies by provider:
- **OpenAI**: Pay-per-use, starts ~$0.002 per 1K tokens
- **Anthropic**: Pay-per-use, starts ~$0.008 per 1K tokens
- **Google AI**: Free tier available, then pay-per-use

Typical document generation costs $0.10-$0.50 per document.

**Q: What happens if my API key expires?**

A: You'll receive errors when using AI features. Simply update the key in Settings → API Keys.

### Privacy & Security Questions

**Q: Does CyberDocGen collect my data?**

A: In Local Mode:
- **No** - Your documents and data stay on your computer
- **No** - API requests go directly from your computer to AI providers
- **Optional** - Anonymous usage analytics (opt-in only)
- **Optional** - Crash reports to improve stability (opt-in only)

**Q: Can CyberDocGen access my files?**

A: Only files you explicitly:
- Import into CyberDocGen
- Create within CyberDocGen
- Store in the application's data directory

The application does not scan or access other files on your computer.

**Q: Is Local Mode HIPAA/GDPR compliant?**

A: CyberDocGen provides tools for compliance, but compliance depends on how you use it. For official compliance:
- Consult with your compliance team
- Review security features (encryption, access control)
- Implement organizational policies
- Consider professional assessment

---

## Need More Help?

**Documentation**:
- [Full Documentation](https://docs.cyberdocgen.com)
- [Video Tutorials](https://youtube.com/cyberdocgen)
- [Compliance Framework Guides](https://docs.cyberdocgen.com/frameworks)

**Support**:
- Email: support@cyberdocgen.com
- Community Forum: [community.cyberdocgen.com](https://community.cyberdocgen.com)
- Feature Requests: [feedback.cyberdocgen.com](https://feedback.cyberdocgen.com)

**Social Media**:
- Twitter: [@cyberdocgen](https://twitter.com/cyberdocgen)
- LinkedIn: [CyberDocGen](https://linkedin.com/company/cyberdocgen)

---

**Version**: 3.0.0 (January 2026)
**Last Updated**: January 21, 2026
**Copyright** © 2026 CyberDocGen. All rights reserved.
