# Progressive Web App (PWA) Implementation

**Phase 3.4 - Complete ✅**

CyberDocGen is now a fully functional Progressive Web App with offline support, installability, and app-like experience.

---

## Features

### ✅ Service Worker
- **Production-ready service worker** with multiple cache strategies
- **Offline support** - App works without internet connection
- **Background sync** - Syncs data when connection is restored
- **Push notifications** - Optional push notification support
- **Automatic updates** - Prompts user when new version is available

### ✅ App Manifest
- **Installable** - Can be installed on desktop and mobile
- **App icons** - Multiple sizes for different devices
- **App shortcuts** - Quick access to key features
- **Standalone mode** - Runs like a native app

### ✅ Offline Experience
- **Custom offline page** - User-friendly offline fallback
- **Offline banner** - Shows when connection is lost
- **Auto-reconnect** - Automatically reloads when online

### ✅ Install Prompts
- **Smart install prompts** - Shows at optimal times
- **Platform-specific UI** - Different prompts for iOS/Android/Desktop
- **Dismissible** - User can dismiss and see again later

---

## Architecture

### Cache Strategies

The service worker uses different strategies for different types of content:

#### 1. **Cache-First** (Static Assets)
Used for: Images, fonts, CSS, JavaScript
- Serves from cache if available
- Falls back to network if not cached
- Caches network responses for future use
- **Cache limit**: 100 items
- **Expiration**: 7 days

```javascript
// Example: Loading images
GET /logo.png
→ Check cache first
→ Serve from cache if found
→ Otherwise fetch from network and cache
```

#### 2. **Network-First** (API Calls)
Used for: API requests, dynamic content
- Tries network first for fresh data
- Falls back to cache if offline
- **Cache limit**: 30 items
- **Expiration**: 5 minutes

```javascript
// Example: API calls
GET /api/documents
→ Try network first
→ Cache successful response
→ Serve cached version if offline
```

#### 3. **Stale-While-Revalidate** (Dynamic Pages)
Used for: HTML pages, dynamic content
- Serves cached version immediately
- Updates cache in background
- **Cache limit**: 50 items
- **Expiration**: 1 day

```javascript
// Example: Page navigation
GET /dashboard
→ Serve cached version instantly
→ Fetch fresh version in background
→ Use fresh version on next visit
```

### File Structure

```
client/
├── public/
│   ├── sw.js                    # Service worker (370 lines)
│   ├── manifest.json            # PWA manifest
│   ├── offline.html             # Offline fallback page
│   └── icon-*.png              # App icons (multiple sizes)
├── src/
│   ├── lib/
│   │   └── serviceWorker.ts    # Registration utilities (329 lines)
│   └── components/
│       └── PWAInstallPrompt.tsx # Install prompt component (150 lines)
```

---

## Usage

### Basic Setup

The service worker is automatically registered in `main.tsx`:

```typescript
import { registerServiceWorker } from './lib/serviceWorker';

registerServiceWorker();
```

### Custom Configuration

You can customize the service worker behavior:

```typescript
import { registerServiceWorker } from './lib/serviceWorker';

registerServiceWorker({
  onUpdate: (registration) => {
    console.log('New version available!');
    // Custom update handling
  },
  onSuccess: (registration) => {
    console.log('Service worker registered');
  },
  onOffline: () => {
    console.log('App is offline');
    // Custom offline handling
  },
  onOnline: () => {
    console.log('App is online');
    // Custom online handling
  },
});
```

### Using the Install Prompt

Add the install prompt to your app:

```tsx
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

function App() {
  return (
    <div>
      {/* Your app content */}

      {/* Install prompt */}
      <PWAInstallPrompt
        title="Install CyberDocGen"
        message="Get the best experience with offline access"
        hideAfterDays={7}
        position="bottom"
      />
    </div>
  );
}
```

Or use the inline button:

```tsx
import { PWAInstallButton } from './components/PWAInstallPrompt';

function Navbar() {
  return (
    <nav>
      {/* Other nav items */}
      <PWAInstallButton />
    </nav>
  );
}
```

### Utility Functions

```typescript
import {
  isStandalone,
  isIOS,
  isAndroid,
  showInstallPrompt,
  isInstallPromptAvailable,
  getServiceWorkerRegistration,
  unregisterServiceWorker,
} from './lib/serviceWorker';

// Check if app is installed
if (isStandalone()) {
  console.log('Running as installed app');
}

// Check device type
if (isIOS()) {
  console.log('iOS device - show iOS-specific instructions');
}

// Manually trigger install
if (isInstallPromptAvailable()) {
  const accepted = await showInstallPrompt();
  if (accepted) {
    console.log('User installed the app');
  }
}

// Get registration
const registration = getServiceWorkerRegistration();
if (registration) {
  console.log('Service worker is active');
}

// Unregister (for debugging)
await unregisterServiceWorker();
```

---

## Testing

### Testing Offline Functionality

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Select "Offline" from throttling dropdown**
4. **Reload the page**
5. **Verify**:
   - Offline page shows
   - Offline banner appears
   - Cached resources load
   - API calls return cached data

### Testing Service Worker

1. **Open DevTools** (F12)
2. **Go to Application tab**
3. **Click "Service Workers"**
4. **Verify**:
   - Service worker is registered
   - Status is "activated and running"
   - Scope is "/"

### Testing Caching

1. **Open DevTools** → **Application** → **Cache Storage**
2. **Verify caches exist**:
   - `static-v1` - Static assets
   - `dynamic-v1` - Dynamic content
   - `api-v1` - API responses
3. **Check cached files**:
   - Static: JS, CSS, images, fonts
   - Dynamic: HTML pages
   - API: Response data

### Testing Install Prompt

#### Desktop (Chrome/Edge)
1. **Visit the app** over HTTPS
2. **Wait for install prompt** (or click install button)
3. **Click "Install"**
4. **Verify**:
   - App installs to desktop
   - Opens in standalone window
   - Appears in start menu/applications

#### Android
1. **Open in Chrome**
2. **Tap menu** → **Add to Home Screen**
3. **Verify**:
   - Icon appears on home screen
   - Opens in fullscreen
   - Shows splash screen

#### iOS
1. **Open in Safari**
2. **See install instructions** (tap Share → Add to Home Screen)
3. **Follow instructions**
4. **Verify**:
   - Icon appears on home screen
   - Opens in fullscreen

### Testing Updates

1. **Make a change** to the service worker
2. **Increment CACHE_VERSION** in `sw.js`
3. **Reload the app**
4. **Verify**:
   - Update notification appears
   - "Update" button works
   - Old caches are deleted
   - New version activates

---

## Service Worker Events

### Install Event
Triggered when service worker is first installed:
```javascript
self.addEventListener('install', (event) => {
  // Precache essential assets
  event.waitUntil(
    caches.open('static-v1')
      .then(cache => cache.addAll(PRECACHE_ASSETS))
  );
});
```

### Activate Event
Triggered when service worker becomes active:
```javascript
self.addEventListener('activate', (event) => {
  // Clean up old caches
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== currentCache)
          .map(key => caches.delete(key))
      ))
  );
});
```

### Fetch Event
Triggered for every network request:
```javascript
self.addEventListener('fetch', (event) => {
  // Apply cache strategy based on request type
  if (request.url.includes('/api/')) {
    event.respondWith(networkFirst(request));
  } else if (isStaticAsset(request.url)) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});
```

### Sync Event (Background Sync)
Triggered when connection is restored:
```javascript
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncPendingData());
  }
});
```

### Push Event (Notifications)
Triggered when push notification is received:
```javascript
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/icon-192.png',
    badge: '/icon-96.png',
  };
  event.waitUntil(
    self.registration.showNotification('CyberDocGen', options)
  );
});
```

---

## Manifest Configuration

The `manifest.json` file defines the app's metadata:

```json
{
  "name": "CyberDocGen - Compliance Management System",
  "short_name": "CyberDocGen",
  "description": "Enterprise compliance management system",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Dashboard",
      "url": "/",
      "icons": [{ "src": "/icon-96.png", "sizes": "96x96" }]
    },
    {
      "name": "Documents",
      "url": "/documents",
      "icons": [{ "src": "/icon-96.png", "sizes": "96x96" }]
    }
  ],
  "categories": ["business", "productivity", "utilities"],
  "features": ["offline", "background-sync", "push-notifications"]
}
```

### Key Properties

- **name**: Full app name (shown during install)
- **short_name**: Short name (shown on home screen)
- **start_url**: URL to open when app launches
- **display**: How app should be displayed (`standalone`, `fullscreen`, `minimal-ui`)
- **theme_color**: Browser theme color
- **icons**: App icons in multiple sizes
- **shortcuts**: Quick actions from app icon
- **categories**: App Store categories
- **features**: PWA features supported

---

## Requirements

### HTTPS Requirement
Service workers require HTTPS (except localhost):
- ✅ Development: Works on `localhost` without HTTPS
- ✅ Production: Must be served over HTTPS
- ✅ Use Let's Encrypt for free SSL certificates

### Browser Support
| Browser | Service Worker | Install | Push |
|---------|---------------|---------|------|
| Chrome | ✅ | ✅ | ✅ |
| Edge | ✅ | ✅ | ✅ |
| Firefox | ✅ | ⚠️ | ✅ |
| Safari | ✅ | ⚠️ | ⚠️ |
| iOS Safari | ✅ | ⚠️ | ❌ |

- ✅ Fully supported
- ⚠️ Partial support (manual add to home screen)
- ❌ Not supported

### Icon Requirements
The manifest references multiple icon sizes:

Required sizes:
- **72x72** - Small devices
- **96x96** - Standard mobile
- **128x128** - High-DPI mobile
- **144x144** - Tablet
- **152x152** - iOS
- **192x192** - Standard (required)
- **384x384** - High-DPI
- **512x512** - Splash screen (required)

**Note**: Currently using placeholder icons. Replace with actual app icons:
```bash
# Generate icons from source
convert logo.png -resize 192x192 client/public/icon-192.png
convert logo.png -resize 512x512 client/public/icon-512.png
# ... repeat for all sizes
```

---

## Best Practices

### 1. Cache Management
- ✅ Set cache size limits (prevents unlimited growth)
- ✅ Set expiration times (keeps data fresh)
- ✅ Clean up old caches on activate
- ✅ Version your caches (`v1`, `v2`, etc.)

### 2. Update Strategy
- ✅ Check for updates hourly
- ✅ Prompt user before updating
- ✅ Don't force reload without permission
- ✅ Use `skipWaiting()` carefully

### 3. Offline Experience
- ✅ Provide custom offline page
- ✅ Show offline indicator
- ✅ Queue failed requests for retry
- ✅ Cache critical resources

### 4. Performance
- ✅ Precache only essential assets
- ✅ Use appropriate cache strategies
- ✅ Limit cache size
- ✅ Clean up expired caches

### 5. User Experience
- ✅ Don't show install prompt immediately
- ✅ Allow users to dismiss prompts
- ✅ Respect user preferences
- ✅ Provide clear update notifications

---

## Troubleshooting

### Service Worker Not Registering
1. **Check HTTPS**: Service workers require HTTPS (except localhost)
2. **Check file location**: `sw.js` must be in public directory
3. **Check scope**: Service worker scope must include your routes
4. **Check console**: Look for registration errors

### Caching Issues
1. **Clear cache**: DevTools → Application → Clear Storage
2. **Hard reload**: Ctrl+Shift+R (bypasses cache)
3. **Unregister SW**: DevTools → Application → Service Workers → Unregister
4. **Check cache names**: Verify caches match CACHE_VERSION

### Update Not Working
1. **Increment version**: Change `CACHE_VERSION` in `sw.js`
2. **Force update**: DevTools → Application → Service Workers → Update
3. **Skip waiting**: Click "skipWaiting" in DevTools
4. **Check update logic**: Verify `updatefound` listener

### Install Prompt Not Showing
1. **Check criteria**:
   - Must be served over HTTPS
   - Must have valid manifest
   - Must have registered service worker
   - User must not have dismissed recently
   - Must not be already installed
2. **Check console**: Look for manifest errors
3. **Test manually**: Use install button component

---

## Performance Metrics

### Cache Hit Rates (Target)
- Static assets: **95%+**
- API responses: **70%+**
- Pages: **90%+**

### Load Times (Target)
- First load: **< 2s**
- Cached load: **< 500ms**
- Offline load: **< 300ms**

### Cache Sizes (Limits)
- Static cache: **100 items**
- Dynamic cache: **50 items**
- API cache: **30 items**
- Total storage: **< 50MB**

---

## Future Enhancements

### Planned Features
- [ ] Push notification UI preferences
- [ ] Background sync queue management
- [ ] Periodic background sync
- [ ] Web Share API integration
- [ ] File handling API
- [ ] Protocol handlers
- [ ] Badge API for unread counts

### Advanced Caching
- [ ] Cache warming on install
- [ ] Predictive prefetching
- [ ] Adaptive cache strategies
- [ ] Network quality detection
- [ ] Dynamic cache limits

---

## Resources

### Documentation
- [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Google PWA Guide](https://web.dev/progressive-web-apps/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

### Tools
- [Lighthouse PWA Audit](https://developers.google.com/web/tools/lighthouse)
- [PWA Builder](https://www.pwabuilder.com/)
- [Workbox](https://developers.google.com/web/tools/workbox) (alternative library)

### Testing
- Chrome DevTools → Application tab
- Firefox DevTools → Application tab
- [PWA Testing Checklist](https://web.dev/pwa-checklist/)

---

## Summary

**Status**: ✅ Phase 3.4 Complete

**Implemented**:
- ✅ Service worker with multiple cache strategies
- ✅ PWA manifest with app metadata
- ✅ Offline fallback page
- ✅ Install prompt components
- ✅ Online/offline detection
- ✅ Update notifications
- ✅ Background sync support
- ✅ Push notification support

**Code Added**:
- `client/public/sw.js` - 370 lines
- `client/src/lib/serviceWorker.ts` - 329 lines
- `client/src/components/PWAInstallPrompt.tsx` - 150 lines
- `client/public/manifest.json` - 126 lines
- `client/public/offline.html` - 185 lines

**Total**: 1,160 lines of production-ready PWA code

**Next Steps**: Testing with real devices and generating actual app icons.

---

**Documentation Date**: December 14, 2025
**Phase**: 3.4 - PWA Implementation
**Status**: Complete ✅
