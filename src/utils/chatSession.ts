export interface ChatSessionStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export const CHAT_SESSION_TTL_SECONDS = 60 * 60 * 24;
const SESSION_KEY_PREFIX = 'chat-session:';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sessionKey(sessionId: string): string {
  return `${SESSION_KEY_PREFIX}${sessionId}`;
}

export function isChatSessionId(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

export async function issueChatSession(
  store: ChatSessionStore,
  sessionId: string = crypto.randomUUID(),
): Promise<string> {
  await store.put(sessionKey(sessionId), '1', {
    expirationTtl: CHAT_SESSION_TTL_SECONDS,
  });
  return sessionId;
}

export async function isChatSessionValid(
  store: ChatSessionStore,
  sessionId: unknown,
): Promise<boolean> {
  if (!isChatSessionId(sessionId)) return false;
  return (await store.get(sessionKey(sessionId))) === '1';
}

export function createMemoryChatSessionStore(
  clock: () => number = Date.now,
): ChatSessionStore {
  const entries = new Map<string, { value: string; expiresAt: number }>();

  return {
    async get(key) {
      const entry = entries.get(key);
      if (!entry) return null;
      if (entry.expiresAt <= clock()) {
        entries.delete(key);
        return null;
      }
      return entry.value;
    },
    async put(key, value, options) {
      const ttlMs = (options?.expirationTtl ?? CHAT_SESSION_TTL_SECONDS) * 1000;
      entries.set(key, { value, expiresAt: clock() + ttlMs });
    },
  };
}

export interface KvChatSessionBinding {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
}

export function createKvChatSessionStore(kv: KvChatSessionBinding): ChatSessionStore {
  return {
    get: (key) => kv.get(key),
    put: (key, value, options) => kv.put(key, value, options),
  };
}
