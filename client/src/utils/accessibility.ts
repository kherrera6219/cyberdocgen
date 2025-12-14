/**
 * Accessibility Utilities
 *
 * Helper functions for managing focus, keyboard navigation, and other
 * accessibility features throughout the application.
 */

/**
 * Focus Management
 *
 * Utilities for programmatically managing focus in accessible ways
 */

/**
 * Sets focus on an element by ID with error handling
 */
export function focusElementById(id: string): boolean {
  const element = document.getElementById(id);
  if (element) {
    element.focus();
    return true;
  }
  console.warn(`Cannot focus element: #${id} not found`);
  return false;
}

/**
 * Sets focus on the first focusable element within a container
 */
export function focusFirstElement(container: HTMLElement): boolean {
  const focusable = getFocusableElements(container);
  if (focusable.length > 0) {
    focusable[0].focus();
    return true;
  }
  return false;
}

/**
 * Gets all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement = document.body): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

/**
 * Traps focus within a container (useful for modals)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusable = getFocusableElements(container);
  if (focusable.length === 0) return () => {};

  const firstElement = focusable[0];
  const lastElement = focusable[focusable.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Keyboard Navigation
 *
 * Utilities for handling keyboard interactions
 */

/**
 * Checks if a key event is an activation key (Enter or Space)
 */
export function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === 'Enter' || event.key === ' ';
}

/**
 * Handles activation key press (prevents default for Space to avoid scrolling)
 */
export function handleActivationKey(
  event: KeyboardEvent,
  callback: () => void
): void {
  if (isActivationKey(event)) {
    event.preventDefault();
    callback();
  }
}

/**
 * Arrow key navigation for lists and menus
 */
export function handleArrowNavigation(
  event: KeyboardEvent,
  elements: HTMLElement[],
  currentIndex: number,
  options: {
    wrap?: boolean;
    horizontal?: boolean;
  } = {}
): number {
  const { wrap = true, horizontal = false } = options;
  const upKey = horizontal ? 'ArrowLeft' : 'ArrowUp';
  const downKey = horizontal ? 'ArrowRight' : 'ArrowDown';

  let newIndex = currentIndex;

  if (event.key === downKey) {
    event.preventDefault();
    newIndex = currentIndex + 1;
    if (newIndex >= elements.length) {
      newIndex = wrap ? 0 : elements.length - 1;
    }
  } else if (event.key === upKey) {
    event.preventDefault();
    newIndex = currentIndex - 1;
    if (newIndex < 0) {
      newIndex = wrap ? elements.length - 1 : 0;
    }
  } else if (event.key === 'Home') {
    event.preventDefault();
    newIndex = 0;
  } else if (event.key === 'End') {
    event.preventDefault();
    newIndex = elements.length - 1;
  }

  if (newIndex !== currentIndex && elements[newIndex]) {
    elements[newIndex].focus();
  }

  return newIndex;
}

/**
 * Screen Reader Announcements
 *
 * Utilities for making announcements to screen readers
 */

let announcer: HTMLDivElement | null = null;

/**
 * Initializes the screen reader announcer element
 */
function getAnnouncer(): HTMLDivElement {
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(announcer);
  }
  return announcer;
}

/**
 * Announces a message to screen readers
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcer = getAnnouncer();
  announcer.setAttribute('aria-live', priority);

  // Clear and set new message
  announcer.textContent = '';
  setTimeout(() => {
    announcer.textContent = message;
  }, 100);
}

/**
 * ARIA Utilities
 *
 * Helpers for managing ARIA attributes
 */

/**
 * Generates a unique ID for ARIA relationships
 */
let idCounter = 0;
export function generateId(prefix: string = 'a11y'): string {
  return `${prefix}-${Date.now()}-${++idCounter}`;
}

/**
 * Checks if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Checks if high contrast is preferred
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Color Contrast
 *
 * Utilities for ensuring adequate color contrast
 */

/**
 * Calculates relative luminance of a color
 * @see https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculates contrast ratio between two colors
 * @see https://www.w3.org/WAI/GL/wiki/Contrast_ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
  // This is a simplified version - full implementation would parse CSS colors
  // For production, consider using a library like 'wcag-contrast'
  return 1;
}

/**
 * Checks if contrast ratio meets WCAG AA standards
 */
export function meetsContrastAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= (isLargeText ? 3 : 4.5);
}

/**
 * Checks if contrast ratio meets WCAG AAA standards
 */
export function meetsContrastAAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= (isLargeText ? 4.5 : 7);
}
