/**
 * Service Worker Registration and PWA Utilities
 *
 * Handles service worker registration, updates, and PWA features.
 */

interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register service worker with update handling
 */
export function registerServiceWorker(config: ServiceWorkerConfig = {}) {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service workers not supported');
    return;
  }

  const isDev = import.meta.env.DEV;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      swRegistration = registration;

      if (isDev) {
        console.info('[SW] Service worker registered:', registration.scope);
      }

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            if (isDev) {
              console.log('[SW] New version available');
            }

            if (config.onUpdate) {
              config.onUpdate(registration);
            } else {
              // Default behavior: show update notification
              showUpdateNotification(registration);
            }
          }
        });
      });

      // Success callback
      if (config.onSuccess) {
        config.onSuccess(registration);
      }

      // Check for updates every hour
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

    } catch (error) {
      console.error('[SW] Registration failed:', error);
    }
  });

  // Online/offline detection
  setupOnlineOfflineDetection(config);
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  const registration = await navigator.serviceWorker.getRegistration();

  if (registration) {
    return registration.unregister();
  }

  return false;
}

/**
 * Show update notification when new version is available
 */
function showUpdateNotification(registration: ServiceWorkerRegistration) {
  const updateBanner = document.createElement('div');
  updateBanner.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #2563eb;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  updateBanner.innerHTML = `
    <span>A new version is available!</span>
    <button id="sw-update-btn" style="
      background: white;
      color: #2563eb;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
    ">Update</button>
    <button id="sw-dismiss-btn" style="
      background: transparent;
      color: white;
      border: 1px solid white;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    ">Later</button>
  `;

  document.body.appendChild(updateBanner);

  // Update button
  document.getElementById('sw-update-btn')?.addEventListener('click', () => {
    skipWaiting(registration);
    document.body.removeChild(updateBanner);
  });

  // Dismiss button
  document.getElementById('sw-dismiss-btn')?.addEventListener('click', () => {
    document.body.removeChild(updateBanner);
  });
}

/**
 * Tell service worker to skip waiting and activate
 */
export function skipWaiting(registration: ServiceWorkerRegistration) {
  const waiting = registration.waiting;

  if (!waiting) return;

  // Send message to service worker to skip waiting
  waiting.postMessage({ type: 'SKIP_WAITING' });

  // Reload page when new service worker takes control
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

/**
 * Setup online/offline detection
 */
function setupOnlineOfflineDetection(config: ServiceWorkerConfig) {
  const updateOnlineStatus = () => {
    if (navigator.onLine) {
      console.log('[SW] Online');
      hideOfflineBanner();
      if (config.onOnline) config.onOnline();
    } else {
      console.log('[SW] Offline');
      showOfflineBanner();
      if (config.onOffline) config.onOffline();
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  // Check initial status
  if (!navigator.onLine) {
    showOfflineBanner();
    if (config.onOffline) config.onOffline();
  }
}

/**
 * Show offline banner
 */
function showOfflineBanner() {
  // Don't show banner if already exists
  if (document.getElementById('offline-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'offline-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #f59e0b;
    color: white;
    padding: 12px;
    text-align: center;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
  `;
  banner.textContent = '⚠️ You are currently offline. Some features may be unavailable.';

  document.body.appendChild(banner);
}

/**
 * Hide offline banner
 */
function hideOfflineBanner() {
  const banner = document.getElementById('offline-banner');
  if (banner) {
    banner.remove();
  }
}

/**
 * Get current service worker registration
 */
export function getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
  return swRegistration;
}

/**
 * Check if app is running in standalone mode (installed as PWA)
 */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Check if device is iOS
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Check if device is Android
 */
export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

/**
 * PWA install prompt interface
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

/**
 * Setup PWA install prompt
 */
export function setupInstallPrompt(
  onPromptAvailable?: (event: BeforeInstallPromptEvent) => void
) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;

    console.log('[PWA] Install prompt available');

    if (onPromptAvailable) {
      onPromptAvailable(deferredPrompt);
    }
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed');
    deferredPrompt = null;
  });
}

/**
 * Show PWA install prompt
 */
export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('[PWA] Install prompt not available');
    return false;
  }

  try {
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    console.log('[PWA] User choice:', choiceResult.outcome);

    deferredPrompt = null;

    return choiceResult.outcome === 'accepted';
  } catch (error) {
    console.error('[PWA] Install prompt error:', error);
    return false;
  }
}

/**
 * Check if install prompt is available
 */
export function isInstallPromptAvailable(): boolean {
  return deferredPrompt !== null;
}
