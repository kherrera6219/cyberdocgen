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
      className="skip-navigation"
      style={{
        position: 'absolute',
        left: '-9999px',
        zIndex: 999,
        padding: '1rem 1.5rem',
        backgroundColor: 'var(--primary)',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '0 0 0.25rem 0',
        fontWeight: 500,
        fontSize: '0.875rem',
        transition: 'left 0.2s ease-in-out',
      }}
      onFocus={(e) => {
        e.currentTarget.style.left = '0';
      }}
      onBlur={(e) => {
        e.currentTarget.style.left = '-9999px';
      }}
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
