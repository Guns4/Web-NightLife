/**
 * =====================================================
 * SCROLL ANIMATION HOOK
 * Intersection Observer based scroll animations
 * =====================================================
 */

import { useEffect, useRef, useState, useCallback } from "react";

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

interface ScrollAnimationState {
  isVisible: boolean;
  hasAnimated: boolean;
}

/**
 * Hook for triggering animations when element enters viewport
 */
export function useScrollAnimation(
  options: UseScrollAnimationOptions = {}
): [React.RefObject<any>, ScrollAnimationState] {
  const { threshold = 0.1, rootMargin = "0px", triggerOnce = true } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ScrollAnimationState>({
    isVisible: false,
    hasAnimated: false,
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Skip if already animated and should trigger once
    if (state.hasAnimated && triggerOnce) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        
        if (isIntersecting) {
          setState({
            isVisible: true,
            hasAnimated: true,
          });
          
          // Disconnect if trigger once
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setState(prev => ({
            ...prev,
            isVisible: false,
          }));
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, state.hasAnimated]);

  return [ref, state];
}

/**
 * Hook for parallax scroll effects
 */
export function useParallax(offset: number = 50) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const transform = `translateY(${scrollY * offset}px)`;

  return { scrollY, transform };
}

/**
 * Hook for scroll progress (0 to 1)
 */
export function useScrollProgress(containerRef?: React.RefObject<HTMLElement>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = containerRef?.current || document.body;
    
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = container.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;
      setProgress(Math.min(1, Math.max(0, scrollPercent)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [containerRef]);

  return progress;
}

/**
 * Hook for triggering animation at specific scroll position
 */
export function useScrollTrigger(threshold: number = 100) {
  const [isTriggered, setIsTriggered] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsTriggered(scrollY > threshold);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Check initial state
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return isTriggered;
}

/**
 * Animation variants for Framer Motion
 */
export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

export const fadeInDown = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const slideInLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

export const slideInRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};
