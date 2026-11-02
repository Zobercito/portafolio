import type { ChatSessionResponse, PublicConfigResponse } from '../types/api';
import { loadTurnstileScript } from './turnstileLoader';

const STORAGE_KEY = 'portfolio-chat-session';

interface ClientConfig {
  sitekey: string | null;
  guardEnabled: boolean;
}

let configPromise: Promise<ClientConfig> | null = null;
let sessionPromise: Promise<string | null> | null = null;

export function getStoredChatSession(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearChatSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable (private mode); the in-memory session still works.
  }
}

function storeChatSession(sessionId: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, sessionId);
  } catch {
    // Ignore storage failures.
  }
}

async function resolveConfig(): Promise<ClientConfig> {
  const form = document.querySelector<HTMLElement>('[data-contact-form]');
  const fromAttribute = form?.dataset.turnstileSitekey?.trim() || null;

  try {
    const response = await fetch('/api/config');
    if (!response.ok) {
      return { sitekey: fromAttribute, guardEnabled: false };
    }
    const data = (await response.json()) as PublicConfigResponse;
    return {
      sitekey: fromAttribute || data.turnstileSitekey?.trim() || null,
      guardEnabled: Boolean(data.chatGuardEnabled),
    };
  } catch {
    return { sitekey: fromAttribute, guardEnabled: false };
  }
}

function getConfig(): Promise<ClientConfig> {
  configPromise ??= resolveConfig();
  return configPromise;
}

async function requestTurnstileToken(sitekey: string): Promise<string> {
  const api = await loadTurnstileScript();
  if (!api) throw new Error('Turnstile no disponible');

  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:0;bottom:0;width:0;height:0;overflow:hidden;';
  document.body.appendChild(container);

  return new Promise<string>((resolve, reject) => {
    let settled = false;
    let widgetId = '';

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      try {
        if (widgetId) api.remove(widgetId);
      } catch {
        // Widget already removed.
      }
      container.remove();
      callback();
    };

    try {
      widgetId = api.render(container, {
        sitekey,
        size: 'invisible',
        execution: 'execute',
        theme: 'dark',
        callback: (token) => finish(() => resolve(token)),
        'error-callback': () =>
          finish(() => reject(new Error('Verificación de seguridad fallida'))),
        'timeout-callback': () =>
          finish(() => reject(new Error('La verificación de seguridad expiró'))),
      });
    } catch (error) {
      container.remove();
      reject(error);
      return;
    }

    const execute = (attempt = 0) => {
      if (settled) return;
      try {
        api.execute(widgetId);
      } catch (error) {
        if (attempt < 20) {
          window.setTimeout(() => execute(attempt + 1), 250);
        } else {
          finish(() => reject(error));
        }
      }
    };

    window.setTimeout(() => execute(), 0);
  });
}

async function createChatSession(): Promise<string | null> {
  const config = await getConfig();
  if (!config.guardEnabled || !config.sitekey) return null;
  const sitekey = config.sitekey;

  try {
    const turnstileToken = await requestTurnstileToken(sitekey);
    const response = await fetch('/api/chat/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turnstileToken }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as ChatSessionResponse;
    if (!data.sessionId) return null;

    storeChatSession(data.sessionId);
    return data.sessionId;
  } catch {
    return null;
  }
}

/**
 * Returns a verified chat session id, running the invisible Turnstile
 * challenge once per browser session. Concurrent callers share one handshake.
 */
export function ensureChatSession(): Promise<string | null> {
  const existing = getStoredChatSession();
  if (existing) return Promise.resolve(existing);

  sessionPromise ??= createChatSession().finally(() => {
    sessionPromise = null;
  });
  return sessionPromise;
}
