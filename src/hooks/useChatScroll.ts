import { useRef, useEffect } from 'react';

/**
 * Automatically scrolls to the bottom sentinel element whenever
 * the given dependencies change (new message or typing indicator).
 */
export function useChatScroll(deps: unknown[]) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { scrollRef };
}
