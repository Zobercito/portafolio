/**
 * Web Vitals Tracking
 *
 * Tracks Core Web Vitals (CLS, LCP, INP, TTFB) and sends to analytics
 * FID es deprecated, usamos INP en su lugar
 */

import { onCLS, onLCP, onINP, onTTFB } from 'web-vitals';

export function trackWebVitals() {
  try {
    // Cumulative Layout Shift
    onCLS((metric) => {
      console.log('CLS:', metric.value);
      reportWebVital(metric);
    });

    // Largest Contentful Paint
    onLCP((metric) => {
      console.log('LCP:', metric.value);
      reportWebVital(metric);
    });

    // Interaction to Next Paint (reemplaza a FID)
    onINP((metric) => {
      console.log('INP:', metric.value);
      reportWebVital(metric);
    });

    // Time to First Byte
    onTTFB((metric) => {
      console.log('TTFB:', metric.value);
      reportWebVital(metric);
    });
  } catch (error) {
    console.error('Error tracking Web Vitals:', error);
  }
}

function reportWebVital(metric: any) {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`[Web Vital] ${metric.name}:`, metric.value);
  }

  // Send to custom analytics endpoint (optional)
  if (navigator.sendBeacon && typeof window !== 'undefined') {
    try {
      navigator.sendBeacon('/api/analytics', JSON.stringify({ metric }));
    } catch (error) {
      console.error('Error sending Web Vital:', error);
    }
  }
}
