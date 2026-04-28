import { useState, useEffect } from "react";

/**
 * Custom hook to handle the multi-stage animation lifecycle of a modal.
 * Stages:
 * 1. mounted: Component is ready in the DOM.
 * 2. shouldRender: Modal should be present in the document.
 * 3. showAnim: Control CSS transitions (opacity, scale, etc).
 */
export function useModalAnimation(isOpen: boolean, exitDurationMs = 400) {
  const [mounted, setMounted] = useState(false);
  const [showAnim, setShowAnim] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Double rAF to ensure the browser has painted the mounted state 
      // before triggering the animation transition
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setShowAnim(true));
      });
      return () => cancelAnimationFrame(frame);
    } else {
      setShowAnim(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, exitDurationMs);
      return () => clearTimeout(timer);
    }
  }, [isOpen, exitDurationMs]);

  return {
    shouldRender: shouldRender && mounted,
    showAnim,
  };
}
