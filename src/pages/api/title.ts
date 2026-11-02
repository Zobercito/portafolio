import type { APIRoute } from 'astro';
import { getGroqClient } from '../../utils/groqClient';
import { DEFAULT_MODEL } from '../../data/chatModels';
import { modelCandidates, withModelFallback } from '../../utils/groqFallback';
import { cleanTitle } from '../../utils/titleCleanup';
import { TitleValidationError, normalizeTitleRequest } from '../../utils/titleValidation';
import { getClientIp, jsonError, jsonResponse, readJsonBody } from '../../utils/http';
import { checkRateLimit } from '../../utils/rateLimit';
import {
  getChatSessionStore,
  getRateLimitStore,
  isChatGuardEnabled,
  readEnvValue,
} from '../../utils/env';
import { isChatSessionValid } from '../../utils/chatSession';
import { MAX_TITLE_BODY_BYTES, TITLE_RATE_LIMIT } from '../../utils/limits';
import type { TitleResponse } from '../../types/api';

export const prerender = false;

const TITLE_SYSTEM_PROMPT = `Eres un experto redactor. Tu única tarea es leer la interacción entre el usuario y el asistente y generar un título corto y descriptivo para la conversación.
Reglas estrictas:
- El título debe tener entre 3 y 5 palabras máximo.
- NO uses comillas, puntos finales, ni ningún otro signo de puntuación al inicio o final.
- NO des explicaciones, devuelve únicamente el título.
- El título debe describir el tema principal de la consulta.`;

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = getClientIp(request);
    const rate = await checkRateLimit(
      getRateLimitStore(),
      `title:${ip}`,
      TITLE_RATE_LIMIT,
    );
    if (!rate.allowed) {
      return jsonError(
        'Demasiadas solicitudes. Intenta de nuevo en unos segundos.',
        429,
        { 'Retry-After': String(rate.retryAfterSeconds) },
        'RATE_LIMITED',
      );
    }

    if (isChatGuardEnabled()) {
      const sessionId = request.headers.get('x-chat-session');
      const validSession = await isChatSessionValid(getChatSessionStore(), sessionId);
      if (!validSession) {
        return jsonError('Verificación de seguridad requerida', 401, {}, 'CHAT_SESSION_REQUIRED');
      }
    }

    const body = await readJsonBody(request, MAX_TITLE_BODY_BYTES);
    if (!body.ok) return jsonError(body.error, body.status, {}, body.code);

    let normalized: ReturnType<typeof normalizeTitleRequest>;
    try {
      normalized = normalizeTitleRequest(body.data);
    } catch (error) {
      if (error instanceof TitleValidationError) {
        return jsonError(error.message, 400, {}, 'INVALID_TITLE_REQUEST');
      }
      throw error;
    }

    const groq = getGroqClient(readEnvValue('GROQ_API_KEY'));
    const titleMessages = [
      { role: 'system' as const, content: TITLE_SYSTEM_PROMPT },
      {
        role: 'user' as const,
        content: `Genera un título para esto:\nUsuario: ${normalized.userMessage}\nAsistente: ${normalized.assistantMessage}`,
      },
    ];

    const { result: completion } = await withModelFallback(
      modelCandidates(DEFAULT_MODEL),
      (model) =>
        groq.chat.completions.create({
          messages: titleMessages,
          model: model.groqId,
          temperature: 0.3,
          top_p: 1,
          reasoning_effort: 'low',
          max_completion_tokens: 256,
        }),
      (failed, next, error) =>
        console.warn(`Groq: título con ${failed.groqId} falló, se reintenta con ${next.groqId}`, error),
    );

    const title = cleanTitle(completion.choices[0]?.message?.content);
    const responseBody: TitleResponse = { title };

    return jsonResponse(responseBody);
  } catch (error) {
    console.error('Title Generation Error:', error);
    return jsonError('No se pudo generar el título', 500);
  }
};
