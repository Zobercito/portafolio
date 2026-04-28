// Global type declarations for third-party scripts and cross-component globals.
// This file is automatically picked up by TypeScript via tsconfig.json.

declare global {
  interface Window {
    /** Exposed by slideEngine.ts — used by NameTypewriter and other React components */
    goToSlide: (index: number) => void;

    /** Exposed by contactForm.ts — called by the Cloudflare Turnstile script via ?onload= */
    onloadTurnstileCallback: () => void;

    /** Injected by the Cloudflare Turnstile external script */
    turnstile: {
      render: (el: string | HTMLElement, options: any) => string;
      reset: (id?: string) => void;
      getResponse: (id?: string) => string;
    };
  }
}

export {};
