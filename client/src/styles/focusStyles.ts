/**
 * Enhanced Focus Styles (TypeScript Utilities)
 *
 * Improved focus indicators for better keyboard navigation visibility.
 * These styles meet WCAG 2.2 Level AA requirements for focus visibility.
 */

/**
 * Button Component with Enhanced Focus
 *
 * Usage:
 * ```tsx
 * <button className={`${focusButtonStyles.base} ${focusButtonStyles.primary}`}>
 *   Click me
 * </button>
 * ```
 */
export const focusButtonStyles = {
  base: "focus:outline-none focus:ring-2 focus:ring-offset-2 transition-shadow",
  primary: "focus:ring-blue-500",
  secondary: "focus:ring-gray-500",
  success: "focus:ring-green-500",
  danger: "focus:ring-red-500",
  warning: "focus:ring-yellow-500",
};

/**
 * Input Component with Enhanced Focus
 *
 * Usage:
 * ```tsx
 * <input className={`${focusInputStyles.base} ${focusInputStyles.default}`} />
 * ```
 */
export const focusInputStyles = {
  base: "focus:outline-none focus:ring-2 focus:border-transparent transition-colors",
  default: "focus:ring-blue-500",
  error: "focus:ring-red-500",
  success: "focus:ring-green-500",
};

/**
 * Link Component with Enhanced Focus
 *
 * Usage:
 * ```tsx
 * <a href="#" className={focusLinkStyles}>Link with focus</a>
 * ```
 */
export const focusLinkStyles = "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:rounded-sm transition-shadow";

/**
 * Utility Functions for Focus Management
 */

/**
 * Adds enhanced focus styles to an element
 *
 * @param element - The HTML element to add focus styles to
 * @param variant - The color variant (primary, secondary, danger)
 *
 * @example
 * ```tsx
 * const button = document.querySelector('button');
 * addFocusStyles(button, 'primary');
 * ```
 */
export function addFocusStyles(element: HTMLElement, variant: 'primary' | 'secondary' | 'danger' = 'primary') {
  element.classList.add('focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2', 'transition-shadow');

  const ringColors = {
    primary: 'focus:ring-blue-500',
    secondary: 'focus:ring-gray-500',
    danger: 'focus:ring-red-500',
  };

  element.classList.add(ringColors[variant]);
}
