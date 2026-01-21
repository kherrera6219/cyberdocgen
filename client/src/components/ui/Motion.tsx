import { motion, HTMLMotionProps, AnimatePresence } from "framer-motion";
import React from "react";

/**
 * Accessible Motion Primitives
 * 
 * These components wrap Framer Motion to automatically:
 * 1. Respect prefers-reduced-motion via CSS variables
 * 2. Use centralized design tokens for durations and easings
 * 3. Provide a consistent API for common enterprise animations
 */

// Motion variant presets
const variants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
};

const transition = {
  duration: "var(--motion-duration-medium)",
  ease: "var(--motion-ease-standard)",
};

interface MotionProps extends HTMLMotionProps<"div"> {
  variant?: keyof typeof variants;
  children: React.ReactNode;
}

/**
 * Base Motion component with accessible defaults
 */
export const Motion = React.forwardRef<HTMLDivElement, MotionProps>(
  ({ variant = "fadeIn", children, transition: customTransition, ...props }, ref) => {
    const selectedVariant = variants[variant] || variants.fadeIn;
    return (
      <motion.div
        ref={ref}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={selectedVariant}
        transition={{ ...transition, ...customTransition }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Motion.displayName = "Motion";

/**
 * Animated list container
 */
export const MotionList = ({ children, ...props }: HTMLMotionProps<"div">) => (
  <motion.div
    initial="initial"
    animate="animate"
    variants={{
      animate: {
        transition: {
          staggerChildren: 0.05,
        },
      },
    }}
    {...props}
  >
    {children}
  </motion.div>
);

export { AnimatePresence };
