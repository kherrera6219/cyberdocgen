/**
 * Accessible Icon Button Component
 *
 * A properly accessible icon-only button with ARIA label support.
 * Use this component for all icon buttons to ensure accessibility.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * ARIA label that describes the button's action
   * REQUIRED for accessibility
   */
  'aria-label': string;

  /**
   * Icon component to display
   */
  icon: React.ComponentType<{ className?: string }>;

  /**
   * Visual variant
   */
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'destructive';

  /**
   * Button size
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Disabled state
   */
  disabled?: boolean;
}

const variantStyles = {
  default: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
  ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
};

const sizeStyles = {
  sm: 'h-8 w-8 p-1.5',
  md: 'h-10 w-10 p-2',
  lg: 'h-12 w-12 p-2.5',
};

/**
 * IconButton Component
 *
 * @example
 * ```tsx
 * import { X, Plus, Download } from 'lucide-react';
 *
 * // Close button
 * <IconButton
 *   icon={X}
 *   aria-label="Close dialog"
 *   onClick={handleClose}
 * />
 *
 * // Add button
 * <IconButton
 *   icon={Plus}
 *   aria-label="Add new item"
 *   variant="primary"
 *   onClick={handleAdd}
 * />
 *
 * // Download button with loading state
 * <IconButton
 *   icon={Download}
 *   aria-label="Download document"
 *   isLoading={downloading}
 *   onClick={handleDownload}
 * />
 * ```
 */
export function IconButton({
  'aria-label': ariaLabel,
  icon: Icon,
  variant = 'default',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  ...props
}: IconButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-full w-full animate-spin" aria-hidden="true" />
      ) : (
        <Icon className="h-full w-full" aria-hidden="true" />
      )}
    </button>
  );
}

/**
 * Accessible Icon Link Component
 *
 * An icon-only link with proper ARIA labeling.
 */
interface IconLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * ARIA label that describes the link's destination
   * REQUIRED for accessibility
   */
  'aria-label': string;

  /**
   * Icon component to display
   */
  icon: React.ComponentType<{ className?: string }>;

  /**
   * Link size
   */
  size?: 'sm' | 'md' | 'lg';
}

export function IconLink({
  'aria-label': ariaLabel,
  icon: Icon,
  size = 'md',
  className = '',
  ...props
}: IconLinkProps) {
  return (
    <a
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center rounded-md transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${sizeStyles[size]} ${className}`}
      {...props}
    >
      <Icon className="h-full w-full text-gray-700" aria-hidden="true" />
    </a>
  );
}

/**
 * Usage Examples and Migration Guide
 *
 * Replace old icon buttons with accessible versions:
 *
 * BEFORE:
 * ```tsx
 * <button onClick={handleClose}>
 *   <X />
 * </button>
 * ```
 *
 * AFTER:
 * ```tsx
 * <IconButton
 *   icon={X}
 *   aria-label="Close"
 *   onClick={handleClose}
 * />
 * ```
 *
 * BEFORE:
 * ```tsx
 * <button className="icon-btn">
 *   <Trash2 />
 * </button>
 * ```
 *
 * AFTER:
 * ```tsx
 * <IconButton
 *   icon={Trash2}
 *   aria-label="Delete item"
 *   variant="destructive"
 * />
 * ```
 */
