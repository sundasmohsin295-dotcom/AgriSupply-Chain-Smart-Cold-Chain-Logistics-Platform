/**
 * Professional Motion System
 * Consistent timings and reusable animation patterns
 */

export const MOTION_TIMING = {
  microInteraction: 0.12, // 120ms
  componentTransition: 0.2, // 200ms
  pageTransition: 0.3, // 300ms
  verificationSequence: 0.4, // 400ms
} as const;

export const MOTION_VARIANTS = {
  // Fade in
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  
  // Slide up from below
  slideUp: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
  },
  
  // Slide in from right (forward navigation)
  slideInRight: {
    initial: { opacity: 0, x: 12 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -12 },
  },
  
  // Slide in from left (backward navigation)
  slideInLeft: {
    initial: { opacity: 0, x: -12 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 12 },
  },
  
  // Scale from 0.98 to 1
  scaleIn: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  },
  
  // Button press animation
  buttonPress: {
    whileTap: { scale: 0.97 },
  },
};

/**
 * Standard transition configuration
 */
export const MOTION_TRANSITION = {
  micro: { duration: MOTION_TIMING.microInteraction },
  standard: { duration: MOTION_TIMING.componentTransition },
  page: { duration: MOTION_TIMING.pageTransition },
  verify: { duration: MOTION_TIMING.verificationSequence },
} as const;
