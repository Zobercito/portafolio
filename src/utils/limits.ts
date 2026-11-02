export const MAX_CHAT_BODY_BYTES = 128 * 1024;
export const MAX_TITLE_BODY_BYTES = 32 * 1024;
export const MAX_CONTACT_BODY_BYTES = 16 * 1024;

export const MAX_TITLE_USER_MESSAGE_LENGTH = 4000;
export const MAX_TITLE_ASSISTANT_MESSAGE_LENGTH = 8000;

export const CHAT_RATE_LIMIT = { limit: 20, windowMs: 60_000 } as const;
export const CHAT_PER_SESSION_RATE_LIMIT = { limit: 10, windowMs: 60_000 } as const;
export const TITLE_RATE_LIMIT = { limit: 20, windowMs: 60_000 } as const;
export const CONTACT_RATE_LIMIT = { limit: 10, windowMs: 10 * 60_000 } as const;
export const CHAT_SESSION_RATE_LIMIT = { limit: 10, windowMs: 60_000 } as const;
