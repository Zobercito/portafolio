import { useState, useEffect, useRef } from 'react';

interface UseElementOverflowProps {
  buffer?: number;
}

export function useElementOverflow({ buffer = 48 }: UseElementOverflowProps = {}) {
  const containerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [scrollHeight, setScrollHeight] = useState<number>(0);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && contentRef.current) {
        const availableSpace = containerRef.current.clientHeight;
        const requiredSpace = contentRef.current.scrollHeight;

        setIsOverflowing(requiredSpace > availableSpace + 2);
        setScrollHeight(requiredSpace + buffer);
      }
    };

    checkOverflow();
    const resizeObserver = new ResizeObserver(checkOverflow);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    if (contentRef.current) resizeObserver.observe(contentRef.current);

    return () => resizeObserver.disconnect();
  }, [buffer]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (isExpanded && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isExpanded]);

  return {
    containerRef,
    contentRef,
    isOverflowing,
    isExpanded,
    setIsExpanded,
    scrollHeight
  };
}
