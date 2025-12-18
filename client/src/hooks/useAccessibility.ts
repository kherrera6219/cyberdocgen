/**
 * Accessibility Hooks
 *
 * React hooks for common accessibility patterns and features.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  announce,
  trapFocus,
  generateId,
  prefersReducedMotion,
  prefersHighContrast,
} from '../utils/accessibility';

/**
 * Hook to announce messages to screen readers
 *
 * @example
 * ```tsx
 * const { announce } = useAnnounce();
 *
 * function handleSuccess() {
 *   announce('Document saved successfully');
 * }
 * ```
 */
export function useAnnounce() {
  return {
    announce: useCallback(
      (message: string, priority: 'polite' | 'assertive' = 'polite') => {
        announce(message, priority);
      },
      []
    ),
  };
}

/**
 * Hook to trap focus within a modal or dialog
 *
 * @example
 * ```tsx
 * function Modal({ isOpen }: { isOpen: boolean }) {
 *   const modalRef = useFocusTrap(isOpen);
 *
 *   return (
 *     <div ref={modalRef} role="dialog" aria-modal="true">
 *       {/* modal content *\/}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  isActive: boolean
): React.RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!isActive || !ref.current) return;

    const cleanup = trapFocus(ref.current);
    return cleanup;
  }, [isActive]);

  return ref;
}

/**
 * Hook to manage focus on mount
 *
 * @example
 * ```tsx
 * function Dialog() {
 *   const headingRef = useFocusOnMount<HTMLHeadingElement>();
 *
 *   return <h2 ref={headingRef} tabIndex={-1}>Dialog Title</h2>;
 * }
 * ```
 */
export function useFocusOnMount<T extends HTMLElement = HTMLElement>(): React.RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, []);

  return ref;
}

/**
 * Hook to generate stable ARIA IDs for relationships
 *
 * @example
 * ```tsx
 * function FormField() {
 *   const id = useId('field');
 *
 *   return (
 *     <>
 *       <label htmlFor={id}>Name</label>
 *       <input id={id} type="text" />
 *     </>
 *   );
 * }
 * ```
 */
export function useId(prefix?: string): string {
  const [id] = useState(() => generateId(prefix));
  return id;
}

/**
 * Hook to check if user prefers reduced motion
 *
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const prefersReduced = usePrefersReducedMotion();
 *
 *   return (
 *     <div
 *       className={prefersReduced ? 'no-animation' : 'animated'}
 *     >
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = () => {
      setPrefersReduced(mediaQuery.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReduced;
}

/**
 * Hook to check if user prefers high contrast
 *
 * @example
 * ```tsx
 * function Component() {
 *   const prefersHigh = usePrefersHighContrast();
 *
 *   return (
 *     <div className={prefersHigh ? 'high-contrast' : ''}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export function usePrefersHighContrast(): boolean {
  const [prefersHigh, setPrefersHigh] = useState(prefersHighContrast);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');

    const handleChange = () => {
      setPrefersHigh(mediaQuery.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersHigh;
}

/**
 * Hook for managing keyboard navigation in lists
 *
 * @example
 * ```tsx
 * function Menu() {
 *   const { activeIndex, handleKeyDown } = useKeyboardNavigation(items.length);
 *
 *   return (
 *     <ul role="menu" onKeyDown={handleKeyDown}>
 *       {items.map((item, index) => (
 *         <li
 *           key={item.id}
 *           role="menuitem"
 *           tabIndex={index === activeIndex ? 0 : -1}
 *         >
 *           {item.label}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useKeyboardNavigation(
  itemCount: number,
  options: {
    wrap?: boolean;
    horizontal?: boolean;
    onSelect?: (index: number) => void;
  } = {}
) {
  const { wrap = true, horizontal = false, onSelect } = options;
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const upKey = horizontal ? 'ArrowLeft' : 'ArrowUp';
      const downKey = horizontal ? 'ArrowRight' : 'ArrowDown';

      let newIndex = activeIndex;

      if (event.key === downKey) {
        event.preventDefault();
        newIndex = activeIndex + 1;
        if (newIndex >= itemCount) {
          newIndex = wrap ? 0 : itemCount - 1;
        }
      } else if (event.key === upKey) {
        event.preventDefault();
        newIndex = activeIndex - 1;
        if (newIndex < 0) {
          newIndex = wrap ? itemCount - 1 : 0;
        }
      } else if (event.key === 'Home') {
        event.preventDefault();
        newIndex = 0;
      } else if (event.key === 'End') {
        event.preventDefault();
        newIndex = itemCount - 1;
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect?.(activeIndex);
        return;
      }

      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex);
      }
    },
    [activeIndex, itemCount, wrap, horizontal, onSelect]
  );

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
  };
}

/**
 * Hook to restore focus when a component unmounts
 *
 * Useful for modals that need to return focus to the trigger element.
 *
 * @example
 * ```tsx
 * function Modal({ onClose }: { onClose: () => void }) {
 *   useRestoreFocus();
 *
 *   return <div role="dialog">...</div>;
 * }
 * ```
 */
export function useRestoreFocus() {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Save the currently focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Restore focus on unmount
    return () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, []);
}
