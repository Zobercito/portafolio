import { useEffect, useRef, useState } from 'react';

interface UseCarouselProps {
  speed?: number;
  pauseDuration?: number;
}

export function useCarousel({ speed = 0.03, pauseDuration = 1500 }: UseCarouselProps = {}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isManuallyPaused = useRef(false);
  const exactScrollLeft = useRef<number | null>(null);
  const scrollTarget = useRef<number | null>(null);

  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();
    let isVisible = false;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
        if (isVisible) lastTime = performance.now();
      });
    });

    if (scrollRef.current) observer.observe(scrollRef.current);

    const scroll = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      if (scrollRef.current && isVisible) {
        if (exactScrollLeft.current === null) {
          exactScrollLeft.current = scrollRef.current.scrollLeft;
        }

        if (scrollTarget.current !== null) {
          const difference = scrollTarget.current - exactScrollLeft.current;
          if (Math.abs(difference) < 0.5) {
            exactScrollLeft.current = scrollTarget.current;
            scrollTarget.current = null;
          } else {
            const lerpFactor = 1 - Math.exp(-delta * 0.008);
            exactScrollLeft.current += difference * lerpFactor;
          }
          scrollRef.current.scrollLeft = exactScrollLeft.current;
        } else if (!isHovered && !isManuallyPaused.current) {
          exactScrollLeft.current += speed * delta;
          scrollRef.current.scrollLeft = exactScrollLeft.current;
        }

        // Infinite loop logic
        const itemWidth = scrollRef.current.scrollWidth / 8;
        if (exactScrollLeft.current >= itemWidth * 5) {
          exactScrollLeft.current -= itemWidth;
          if (scrollTarget.current !== null) scrollTarget.current -= itemWidth;
          scrollRef.current.scrollLeft = exactScrollLeft.current;
        } else if (exactScrollLeft.current <= itemWidth * 2) {
          exactScrollLeft.current += itemWidth;
          if (scrollTarget.current !== null) scrollTarget.current += itemWidth;
          scrollRef.current.scrollLeft = exactScrollLeft.current;
        }
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [isHovered, speed]);

  const handleManualScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current || exactScrollLeft.current === null) return;
    const amount = scrollRef.current.clientWidth / 2;
    const baseScrollPosition = scrollTarget.current !== null ? scrollTarget.current : exactScrollLeft.current;

    scrollTarget.current = baseScrollPosition + (direction === 'right' ? amount : -amount);
    isManuallyPaused.current = true;
    setTimeout(() => {
      isManuallyPaused.current = false;
    }, pauseDuration);
  };

  return {
    scrollRef,
    setIsHovered,
    handleManualScroll
  };
}
