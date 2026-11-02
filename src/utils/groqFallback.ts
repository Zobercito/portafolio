import { CHAT_MODELS, DEFAULT_MODEL, type ChatModel } from '../data/chatModels.ts';

interface ShapeableError {
  status?: number;
  code?: string;
  message?: string;
  error?: { code?: string; message?: string };
}

const UNAVAILABLE_CODES = new Set(['model_not_found', 'invalid_model', 'model_deprecated']);
const UNAVAILABLE_STATUSES = new Set([400, 404, 410]);
const UNAVAILABLE_MESSAGES =
  /does not exist|do not have access|unknown model|no longer supported|deprecat/i;

/**
 * True when Groq rejects the *model* rather than the request: the catalog can
 * outlive a model (Groq moved the Llama family to its Enterprise plan without
 * notice), and that must not take the whole chat down.
 */
export function isModelUnavailableError(error: unknown): boolean {
  const candidate = error as ShapeableError | null;
  if (!candidate || typeof candidate !== 'object') return false;

  const code = candidate.code ?? candidate.error?.code ?? '';
  if (UNAVAILABLE_CODES.has(code)) return true;

  if (candidate.status !== undefined && UNAVAILABLE_STATUSES.has(candidate.status)) {
    return UNAVAILABLE_MESSAGES.test(`${candidate.message ?? ''} ${candidate.error?.message ?? ''}`);
  }

  return false;
}

export function modelCandidates(preferred: ChatModel): ChatModel[] {
  const ordered = [preferred, DEFAULT_MODEL, ...CHAT_MODELS];
  const seen = new Set<string>();
  return ordered.filter((model) => {
    if (seen.has(model.groqId)) return false;
    seen.add(model.groqId);
    return true;
  });
}

export interface ModelFallbackResult<C, T> {
  result: T;
  model: C;
  fellBack: boolean;
}

export async function withModelFallback<C, T>(
  candidates: C[],
  create: (candidate: C) => Promise<T>,
  onFallback: (failed: C, next: C, error: unknown) => void = () => {},
): Promise<ModelFallbackResult<C, T>> {
  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    try {
      return { result: await create(candidate), model: candidate, fellBack: index > 0 };
    } catch (error) {
      const next = candidates[index + 1];
      if (!next || !isModelUnavailableError(error)) throw error;
      onFallback(candidate, next, error);
    }
  }

  throw new Error('Sin modelos disponibles');
}
