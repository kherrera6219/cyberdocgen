/**
 * Enhanced Focus Styles
 *
 * Improved focus indicators for better keyboard navigation visibility.
 * These styles meet WCAG 2.2 Level AA requirements for focus visibility.
 */

/**
 * Global focus styles that can be imported into any component.
 * Add to your global CSS or component styles.
 */

/* Base focus ring - visible and high contrast */
.focus-visible {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

/* Focus styles for dark mode */
.dark .focus-visible {
  @apply ring-blue-400 ring-offset-gray-900;
}

/* Enhanced focus for buttons */
.btn-focus {
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-shadow;
}

/* Enhanced focus for form inputs */
.input-focus {
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors;
}

/* Focus for links */
.link-focus {
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:rounded-sm;
}

/* Focus for cards and containers */
.card-focus {
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-4;
}

/**
 * React Components with Enhanced Focus
 */

// Button Component with Enhanced Focus
export const focusButtonStyles = {
  base: "focus:outline-none focus:ring-2 focus:ring-offset-2 transition-shadow",
  primary: "focus:ring-blue-500",
  secondary: "focus:ring-gray-500",
  success: "focus:ring-green-500",
  danger: "focus:ring-red-500",
  warning: "focus:ring-yellow-500",
};

// Input Component with Enhanced Focus
export const focusInputStyles = {
  base: "focus:outline-none focus:ring-2 focus:border-transparent transition-colors",
  default: "focus:ring-blue-500",
  error: "focus:ring-red-500",
  success: "focus:ring-green-500",
};

// Link Component with Enhanced Focus
export const focusLinkStyles = "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:rounded-sm transition-shadow";

/**
 * Utility Functions for Focus Management
 */

/**
 * Adds enhanced focus styles to an element
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

/**
 * CSS Custom Properties for Focus Styles
 *
 * Add these to your root CSS for consistent focus styling:
 */
/*
:root {
  --focus-ring-color: #3b82f6;
  --focus-ring-width: 2px;
  --focus-ring-offset: 2px;
  --focus-transition: box-shadow 150ms ease-in-out;
}

.dark {
  --focus-ring-color: #60a5fa;
}

* Enhanced focus ring for all interactive elements *
:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 var(--focus-ring-offset) var(--background-color, white),
    0 0 0 calc(var(--focus-ring-offset) + var(--focus-ring-width)) var(--focus-ring-color);
  transition: var(--focus-transition);
}
*/

/**
 * Tailwind Config Addition
 *
 * Add this to your tailwind.config.js for consistent focus styles:
 */
/*
module.exports = {
  theme: {
    extend: {
      ringWidth: {
        'DEFAULT': '2px',
        '3': '3px',
      },
      ringOffsetWidth: {
        'DEFAULT': '2px',
        '3': '3px',
      },
    },
  },
  plugins: [
    function({ addBase, theme }) {
      addBase({
        ':focus-visible': {
          outline: 'none',
          boxShadow: `0 0 0 ${theme('ringOffsetWidth.DEFAULT')} var(--tw-ring-offset-color), 0 0 0 calc(${theme('ringOffsetWidth.DEFAULT')} + ${theme('ringWidth.DEFAULT')}) var(--tw-ring-color)`,
        },
      });
    },
  ],
};
*/

/**
 * Usage in Components
 */
/*
import { focusButtonStyles, focusInputStyles, focusLinkStyles } from '@/styles/focusStyles';

// Button
<button className={`${focusButtonStyles.base} ${focusButtonStyles.primary}`}>
  Click me
</button>

// Input
<input className={`${focusInputStyles.base} ${focusInputStyles.default}`} />

// Link
<a href="#" className={focusLinkStyles}>
  Link with focus
</a>
*/
