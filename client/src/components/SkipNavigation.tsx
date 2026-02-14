/**
 * Skip Navigation Component
 *
 * Provides keyboard users with a way to skip repetitive navigation
 * and jump directly to main content. Meets WCAG 2.2 Level A criterion 2.4.1.
 *
 * @see https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html
 */

import React from 'react';

export function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="fixed left-3 top-3 z-[999] -translate-y-[200%] rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg transition-transform duration-200 focus:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}

/**
 * Main Content Wrapper
 *
 * Wraps the main content area and provides the target for skip navigation.
 * Use this component to wrap your main page content.
 */
export function MainContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <main id="main-content" tabIndex={-1} className={className}>
      {children}
    </main>
  );
}
