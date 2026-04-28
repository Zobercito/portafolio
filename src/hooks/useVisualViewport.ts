import { useEffect } from 'react';

/**
 * Adjusts the minichat container's position when the mobile virtual
 * keyboard opens, preventing the input from being obscured.
 */
export function useVisualViewport(isInputFocused: boolean) {
  useEffect(() => {
    if (!window.visualViewport) return;

    const handleViewportChange = () => {
      if (window.innerWidth >= 768) return;
      const container = document.getElementById('minichat-container');
      if (!container) return;

      const isKeyboardOpen = window.visualViewport!.height < window.innerHeight * 0.85;
      container.style.transform =
        isInputFocused && isKeyboardOpen ? 'translateY(32px)' : '';
    };

    window.visualViewport.addEventListener('resize', handleViewportChange);
    handleViewportChange();

    return () => window.visualViewport?.removeEventListener('resize', handleViewportChange);
  }, [isInputFocused]);
}
