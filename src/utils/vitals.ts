/**
 * Web Vitals Tracking
 *
 * Tracks Core Web Vitals (CLS, LCP, INP, TTFB).
 * FID is deprecated; we use INP instead.
 */

import { onCLS, onLCP, onINP, onTTFB } from 'web-vitals';

export function trackWebVitals() {
  try {
    onCLS((metric) => {
      if (import.meta.env.DEV) console.log('CLS:', metric.value);
    });

    onLCP((metric) => {
      if (import.meta.env.DEV) console.log('LCP:', metric.value);
    });

    onINP((metric) => {
      if (import.meta.env.DEV) console.log('INP:', metric.value);
    });

    onTTFB((metric) => {
      if (import.meta.env.DEV) console.log('TTFB:', metric.value);
    });
  } catch (error) {
    if (import.meta.env.DEV) console.error('Error tracking Web Vitals:', error);
  }
}
