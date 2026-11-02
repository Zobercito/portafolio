import type { APIRoute } from 'astro';
import { getClientIp, jsonError, jsonResponse, readJsonBody } from '../../../utils/http';
import { checkRateLimit } from '../../../utils/rateLimit';
import {
  getChatSessionStore,
  getRateLimitStore,
  readEnvValue,
} from '../../../utils/env';
import { issueChatSession } from '../../../utils/chatSession';
import { verifyTurnstileToken } from '../../../utils/turnstile';
import { CHAT_SESSION_RATE_LIMIT } from '../../../utils/limits';
import type { ChatSessionResponse } from '../../../types/api';

export const prerender = false;

const MAX_SESSION_BODY_BYTES = 8 * 1024;

/**
 * POST /api/chat/session
 *
 * Exchanges a Turnstile token for a short-lived chat session id. The chat
 * endpoint requires this id when TURNSTILE_SECRET_KEY is configured, so bots
 * cannot consume Groq quota directly.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = getClientIp(request);
    const rate = await checkRateLimit(
      getRateLimitStore(),
      `chat-session:${ip}`,
      CHAT_SESSION_RATE_LIMIT,
    );
    if (!rate.allowed) {
      return jsonError(
        'Demasiadas solicitudes. Intenta de nuevo en unos segundos.',
        429,
        { 'Retry-After': String(rate.retryAfterSeconds) },
        'RATE_LIMITED',
      );
    }

    const turnstileSecretKey = readEnvValue('TURNSTILE_SECRET_KEY');
    if (!turnstileSecretKey) {
      return jsonError('La verificación de chat no está disponible', 503, {}, 'CHAT_GUARD_DISABLED');
    }

    const body = await readJsonBody(request, MAX_SESSION_BODY_BYTES);
    if (!body.ok) return jsonError(body.error, body.status, {}, body.code);

    const payload =
      typeof body.data === 'object' && body.data !== null
        ? (body.data as { turnstileToken?: unknown })
        : null;
    const token =
      typeof payload?.turnstileToken === 'string' ? payload.turnstileToken.trim() : '';

    if (!token || token.length > 10_000) {
      return jsonError('Token de Turnstile requerido', 400, {}, 'INVALID_TURNSTILE_TOKEN');
    }

    const verification = await verifyTurnstileToken(token, turnstileSecretKey, {
      remoteIp: ip,
    });
    if (!verification.success) {
      console.error('Chat Turnstile validation failed:', verification.errorCodes);
      return jsonError('Validación de seguridad fallida', 403, {}, 'TURNSTILE_FAILED');
    }

    const sessionId = await issueChatSession(getChatSessionStore());
    const responseBody: ChatSessionResponse = { sessionId };
    return jsonResponse(responseBody, 200, { 'Cache-Control': 'no-store' });
  } catch (error) {
    console.error('Chat session API error:', error);
    return jsonError('Error interno del servidor', 500);
  }
};
