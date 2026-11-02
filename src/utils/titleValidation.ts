import {
  MAX_TITLE_ASSISTANT_MESSAGE_LENGTH,
  MAX_TITLE_USER_MESSAGE_LENGTH,
} from './limits.ts';

export interface NormalizedTitleRequest {
  userMessage: string;
  assistantMessage: string;
}

export class TitleValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TitleValidationError';
  }
}

export function normalizeTitleRequest(input: unknown): NormalizedTitleRequest {
  const body =
    typeof input === 'object' && input !== null
      ? (input as { userMessage?: unknown; assistantMessage?: unknown })
      : null;

  const userMessage =
    typeof body?.userMessage === 'string' ? body.userMessage.trim() : '';
  const assistantMessage =
    typeof body?.assistantMessage === 'string' ? body.assistantMessage.trim() : '';

  if (!userMessage) {
    throw new TitleValidationError('El mensaje del usuario es requerido');
  }
  if (userMessage.length > MAX_TITLE_USER_MESSAGE_LENGTH) {
    throw new TitleValidationError(
      `El mensaje del usuario no puede superar ${MAX_TITLE_USER_MESSAGE_LENGTH} caracteres`,
    );
  }
  if (assistantMessage.length > MAX_TITLE_ASSISTANT_MESSAGE_LENGTH) {
    throw new TitleValidationError(
      `La respuesta del asistente no puede superar ${MAX_TITLE_ASSISTANT_MESSAGE_LENGTH} caracteres`,
    );
  }

  return { userMessage, assistantMessage };
}
