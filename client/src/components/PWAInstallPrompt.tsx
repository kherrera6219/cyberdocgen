/**
 * PWA Install Prompt Component
 *
 * Shows a prompt to install the app as a PWA when available.
 * Follows accessibility best practices with proper ARIA labels.
 */

import React, { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import { setupInstallPrompt, showInstallPrompt, isStandalone, isIOS } from '../lib/serviceWorker';
import { IconButton } from './IconButton';

interface PWAInstallPromptProps {
  /**
   * Custom title for the prompt
   */
  title?: string;

  /**
   * Custom message for the prompt
   */
  message?: string;

  /**
   * Auto-hide after this many days (default: never)
   */
  hideAfterDays?: number;

  /**
   * Position of the prompt
   */
  position?: 'top' | 'bottom';
}

const STORAGE_KEY = 'pwa-install-dismissed';

export function PWAInstallPrompt({
  title = 'Install CyberDocGen',
  message = 'Install our app for a better experience with offline access and faster performance.',
  hideAfterDays,
  position = 'bottom',
}: PWAInstallPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (isStandalone()) {
      return;
    }

    // Check if user dismissed recently
    if (hideAfterDays) {
      const dismissedDate = localStorage.getItem(STORAGE_KEY);
      if (dismissedDate) {
        const daysSinceDismissed = (Date.now() - parseInt(dismissedDate)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < hideAfterDays) {
          return;
        }
      }
    }

    // Setup install prompt
    setupInstallPrompt(() => {
      setShowPrompt(true);
    });
  }, [hideAfterDays]);

  const handleInstall = async () => {
    setIsInstalling(true);
    const accepted = await showInstallPrompt();
    setIsInstalling(false);

    if (accepted) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  };

  if (!showPrompt) {
    return null;
  }

  // Show iOS-specific instructions
  if (isIOS()) {
    return (
      <div
        role="dialog"
        aria-labelledby="pwa-install-title"
        aria-describedby="pwa-install-description"
        className={`fixed left-0 right-0 z-50 ${position === 'top' ? 'top-0' : 'bottom-0'}`}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '1rem',
          boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 id="pwa-install-title" className="text-lg font-semibold mb-2">
                {title}
              </h2>
              <p id="pwa-install-description" className="text-sm opacity-90 mb-3">
                To install this app on your iOS device, tap the Share button{' '}
                <span aria-label="share icon" role="img">
                  📤
                </span>{' '}
                and then "Add to Home Screen".
              </p>
            </div>

            <IconButton
              icon={X}
              aria-label="Dismiss install prompt"
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            />
          </div>
        </div>
      </div>
    );
  }

  // Standard PWA install prompt (Android, Desktop)
  return (
    <div
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-description"
      className={`fixed left-0 right-0 z-50 ${position === 'top' ? 'top-0' : 'bottom-0'}`}
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '1rem',
        boxShadow: position === 'top'
          ? '0 4px 12px rgba(0, 0, 0, 0.15)'
          : '0 -4px 12px rgba(0, 0, 0, 0.15)',
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div
              className="hidden sm:flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg"
              aria-hidden="true"
            >
              <Download className="w-6 h-6" />
            </div>

            <div className="flex-1">
              <h2 id="pwa-install-title" className="text-base sm:text-lg font-semibold">
                {title}
              </h2>
              <p id="pwa-install-description" className="text-sm opacity-90 mt-1">
                {message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="px-4 py-2 bg-white text-purple-700 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-600"
              aria-label="Install application"
            >
              {isInstalling ? 'Installing...' : 'Install'}
            </button>

            <IconButton
              icon={X}
              aria-label="Dismiss install prompt"
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Smaller, inline PWA install button
 */
export function PWAInstallButton({ className = '' }: { className?: string }) {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      return;
    }

    setupInstallPrompt(() => {
      setCanInstall(true);
    });
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    const accepted = await showInstallPrompt();
    setIsInstalling(false);

    if (accepted) {
      setCanInstall(false);
    }
  };

  if (!canInstall) {
    return null;
  }

  return (
    <button
      onClick={handleInstall}
      disabled={isInstalling}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      aria-label="Install CyberDocGen application"
    >
      <Download className="w-4 h-4" aria-hidden="true" />
      {isInstalling ? 'Installing...' : 'Install App'}
    </button>
  );
}
