"use client";

import { useEffect, useState, useRef, RefObject } from "react";
import { motion, useInView } from "framer-motion";

/**
 * Hook options for scroll reveal animations
 */
interface UseScrollRevealOptions {
  /** Initial animation state */
  initial?: "hidden" | "visible";
  /** Animation variant to use */
  variant?: "fade" | "slide-up" | "scale";
  /** Delay before animation starts */
  delay?: number;
  /** Duration of animation */
  duration?: number;
  /** Viewport margin */
  margin?: string;
  /** Whether to only animate once */
  once?: boolean;
}

/**
 * Default animation variants for scroll reveal
 */
export const scrollRevealVariants = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  "slide-up": {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
};

/**
 * Default transition settings
 */
export const scrollRevealTransition = {
  duration: 0.6,
  ease: [0.4, 0, 0.2, 1],
};

/**
 * Hook for creating scroll reveal animations
 * Uses viewport detection to trigger animations when element enters view
 */
export function useScrollReveal<T extends HTMLElement>(
  options: UseScrollRevealOptions = {}
): {
  ref: RefObject<T | null>;
  isInView: boolean;
  motionProps: Record<string, unknown>;
} {
  const { 
    initial = "hidden", 
    variant = "slide-up", 
    delay = 0, 
    duration = 0.6, 
    margin = "-100px", 
    once = true, 
  } = options;

  const ref = useRef<T | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isInView = useInView(ref, { margin: margin as any, once });

  const motionProps = {
    initial,
    animate: isInView ? "visible" : "hidden",
    variants: {
      ...scrollRevealVariants,
      visible: {
        ...scrollRevealVariants[variant].visible,
        transition: {
          ...scrollRevealTransition,
          delay,
          duration,
        },
      },
      hidden: scrollRevealVariants[variant].hidden,
    },
  };

  return { ref, isInView, motionProps };
}

/**
 * Staggered children animation settings
 */
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

/**
 * Staggered child animation settings
 */
export const staggerChild = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

/**
 * Hook for staggered list animations
 */
export function useStaggeredList<T extends HTMLElement>(
  itemCount: number,
  options: Omit<UseScrollRevealOptions, "variant"> = {}
): {
  containerVariants: Record<string, unknown>;
  itemMotionProps: (index: number) => Record<string, unknown>;
} {
  const { delay = 0, duration = 0.5, margin = "-50px", once = true } = options;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay,
      },
    },
  };

  const itemMotionProps = (index: number) => ({
    initial: "hidden",
    whileInView: "visible",
    viewport: { margin, once },
    variants: {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration,
          ease: [0.4, 0, 0.2, 1],
          delay: index * 0.1,
        },
      },
    },
  });

  return { containerVariants, itemMotionProps };
}

/**
 * Page transition animation settings
 */
export const pageTransition = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.02 },
  transition: {
    duration: 0.4,
    ease: [0.4, 0, 0.2, 1],
  },
};

/**
 * Haptic-like button press animation settings
 */
export const hapticButton = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.92 },
  transition: {
    type: "spring",
    stiffness: 400,
    damping: 17,
  },
};

/**
 * Magnetic button effect (follows cursor)
 */
export function useMagnetic(
  ref: RefObject<HTMLElement>,
  strength: number = 0.3
): { style: { transform: string } } {
  const [style, setStyle] = useState({ transform: "translate(0px, 0px)" });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      setStyle({
        transform: `translate(${deltaX}px, ${deltaY}px)`,
      });
    };

    const handleMouseLeave = () => {
      setStyle({ transform: "translate(0px, 0px)" });
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [ref, strength]);

  return { style };
}
