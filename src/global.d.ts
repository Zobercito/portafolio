// Global type declarations for third-party scripts and cross-component globals.
// This file is automatically picked up by TypeScript via tsconfig.json.

interface TurnstileRenderOptions {
  sitekey: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible' | 'invisible';
  execution?: 'render' | 'execute';
  appearance?: 'always' | 'execute' | 'interaction-only';
  callback?: (token: string) => void;
  'error-callback'?: (code?: string) => void;
  'expired-callback'?: () => void;
  'timeout-callback'?: () => void;
}

interface TurnstileApi {
  render: (el: string | HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (id?: string) => void;
  getResponse: (id?: string) => string;
  execute: (id?: string) => void;
  ready: (callback: () => void) => void;
  remove: (id?: string) => void;
}

declare global {
  interface Window {
    /** Injected by the Cloudflare Turnstile external script (optional until loaded). */
    turnstile?: TurnstileApi;
  }
}

export type { TurnstileApi, TurnstileRenderOptions };
export {};
