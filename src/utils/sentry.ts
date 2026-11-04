/**
 * Sentry Configuration
 *
 * Centraliza error tracking y performance monitoring
 */

import * as Sentry from '@sentry/astro';

export function initSentry() {
  const dsn = import.meta.env.PUBLIC_SENTRY_DSN;

  if (!dsn) {
    console.warn('SENTRY_DSN no configurado');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1, // 10% de requests para performance monitoring
  });

  // Track unhandled errors
  window.addEventListener('error', (event) => {
    Sentry.captureException(event.error);
  });

  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    Sentry.captureException(event.reason);
  });
}

export { Sentry };
