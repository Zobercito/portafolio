import { useEffect } from "react";

/**
 * Custom hook to lock body scrolling when a component (like a modal) is mounted.
 * Prevents "scroll leaking" where background scrolls while modal is open.
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      
      // Clean up: restore original overflow style when unmounted or unlocked
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isLocked]);
}
