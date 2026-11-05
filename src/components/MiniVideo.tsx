import { useState, useEffect, useRef } from 'react';

interface MiniVideoProps {
  src: string;
  poster: string;
  className: string;
}

export default function MiniVideo({ src, poster, className }: MiniVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (document.readyState === 'complete') {
      setReady(true);
      return;
    }
    const onLoad = () => setReady(true);
    window.addEventListener('load', onLoad, { once: true });
    return () => window.removeEventListener('load', onLoad);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.25,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !ready) return;
    if (visible) el.play().catch(() => {});
    else el.pause();
  }, [visible, ready]);

  return (
    <video
      ref={videoRef}
      src={ready ? src : undefined}
      poster={poster}
      preload="auto"
      muted
      loop
      playsInline
      aria-hidden="true"
      className={className}
    />
  );
}
