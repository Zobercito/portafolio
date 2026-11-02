import type { TurnstileApi } from '../global';

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let loader: Promise<TurnstileApi | null> | null = null;

/**
 * Turnstile's runtime is ~1.7 MB, so it is not loaded on page load: whoever
 * needs the captcha (the contact form when it scrolls into view, the chat
 * session on the first message) calls this and the script is injected once.
 */
export function loadTurnstileScript(): Promise<TurnstileApi | null> {
  if (window.turnstile) return Promise.resolve(window.turnstile);

  if (!loader) {
    loader = new Promise<TurnstileApi | null>((resolve) => {
      const script = document.createElement('script');
      script.src = TURNSTILE_SRC;
      script.async = true;
      script.onload = () => resolve(window.turnstile ?? null);
      script.onerror = () => {
        loader = null;
        resolve(null);
      };
      document.head.appendChild(script);
    });
  }

  return loader;
}
