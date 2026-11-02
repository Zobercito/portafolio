import { CHAT_MODELS, DEFAULT_MODEL } from '../data/chatModels.ts';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface NormalizedChatRequest {
  turns: ChatTurn[];
  modelId: string;
}

export const MAX_CHAT_MESSAGES = 20;
export const MAX_MESSAGE_LENGTH = 4000;

export class ChatValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatValidationError';
  }
}

/**
 * Normalizes untrusted chat history from the client:
 * - only allows user/assistant roles (system prompts are injected server-side)
 * - drops empty or non-string content
 * - enforces message count and length limits
 */
export function normalizeChatMessages(input: unknown): ChatTurn[] {
  if (!Array.isArray(input)) {
    throw new ChatValidationError('El historial de mensajes es requerido');
  }

  if (input.length > MAX_CHAT_MESSAGES) {
    throw new ChatValidationError(`El historial no puede superar ${MAX_CHAT_MESSAGES} mensajes`);
  }

  const turns: ChatTurn[] = [];

  for (const raw of input) {
    if (typeof raw !== 'object' || raw === null) continue;

    const { role, content } = raw as { role?: unknown; content?: unknown };
    if (role !== 'user' && role !== 'assistant') continue;
    if (typeof content !== 'string') continue;

    const trimmed = content.trim();
    if (!trimmed) continue;

    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      throw new ChatValidationError(`Cada mensaje puede tener máximo ${MAX_MESSAGE_LENGTH} caracteres`);
    }

    turns.push({ role, content: trimmed });
  }

  if (turns.length === 0) {
    throw new ChatValidationError('No hay mensajes válidos en la solicitud');
  }

  return turns;
}

/**
 * Validates the full chat request. Unknown model ids are rejected instead of
 * silently falling back, so clients get a clear 400 when they drift.
 */
export function normalizeChatRequest(input: unknown): NormalizedChatRequest {
  const body =
    typeof input === 'object' && input !== null
      ? (input as { messages?: unknown; modelId?: unknown })
      : null;

  const turns = normalizeChatMessages(body?.messages);

  let modelId = DEFAULT_MODEL.id;
  const requestedModel = body?.modelId;

  if (requestedModel !== undefined && requestedModel !== null && requestedModel !== '') {
    if (
      typeof requestedModel !== 'string' ||
      !CHAT_MODELS.some((model) => model.id === requestedModel)
    ) {
      throw new ChatValidationError('Modelo no válido');
    }
    modelId = requestedModel;
  }

  return { turns, modelId };
}
