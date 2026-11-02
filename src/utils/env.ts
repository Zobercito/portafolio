import { env } from 'cloudflare:workers';
import {
  createKvRateLimitStore,
  createMemoryRateLimitStore,
  type KvRateLimitBinding,
  type RateLimitStore,
} from './rateLimit';
import {
  createKvChatSessionStore,
  createMemoryChatSessionStore,
  type ChatSessionStore,
  type KvChatSessionBinding,
} from './chatSession';

export interface RuntimeEnv {
  GROQ_API_KEY?: string;
  PUBLIC_TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  WEB3FORMS_ACCESS_KEY?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  CONTACT_TO_EMAIL?: string;
  SESSION?: KvRateLimitBinding & KvChatSessionBinding;
}

let memoryRateLimitStore: RateLimitStore | null = null;
let memoryChatSessionStore: ChatSessionStore | null = null;

export function getRuntimeEnv(): RuntimeEnv {
  return (env ?? {}) as unknown as RuntimeEnv;
}

/** Reads a runtime binding first, then falls back to the build-time value. */
export function readEnvValue(name: keyof RuntimeEnv): string | undefined {
  const runtimeValue = getRuntimeEnv()[name];
  if (typeof runtimeValue === 'string' && runtimeValue) return runtimeValue;

  const buildEnv = import.meta.env as unknown as Record<string, unknown>;
  const buildValue = buildEnv[name];
  return typeof buildValue === 'string' && buildValue ? buildValue : undefined;
}

export function isChatGuardEnabled(): boolean {
  return Boolean(readEnvValue('TURNSTILE_SECRET_KEY'));
}

export function getRateLimitStore(): RateLimitStore {
  const kv = getRuntimeEnv().SESSION;
  if (kv) return createKvRateLimitStore(kv);

  memoryRateLimitStore ??= createMemoryRateLimitStore();
  return memoryRateLimitStore;
}

export function getChatSessionStore(): ChatSessionStore {
  const kv = getRuntimeEnv().SESSION;
  if (kv) return createKvChatSessionStore(kv);

  memoryChatSessionStore ??= createMemoryChatSessionStore();
  return memoryChatSessionStore;
}
