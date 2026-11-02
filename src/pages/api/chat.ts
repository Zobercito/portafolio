import type { APIRoute } from 'astro';
import { getGroqClient } from '../../utils/groqClient';
import { PORTFOLIO_SYSTEM_PROMPT } from '../../data/chatbot-context';
import { CHAT_MODELS, DEFAULT_MODEL } from '../../data/chatModels';
import { ChatValidationError, normalizeChatRequest } from '../../utils/chatValidation';
import { getClientIp, jsonError, readJsonBody } from '../../utils/http';
import { checkRateLimit } from '../../utils/rateLimit';
import {
  getChatSessionStore,
  getRateLimitStore,
  isChatGuardEnabled,
  readEnvValue,
} from '../../utils/env';
import { isChatSessionValid } from '../../utils/chatSession';
import { formatSseEvent } from '../../utils/sse';
import {
  CHAT_PER_SESSION_RATE_LIMIT,
  CHAT_RATE_LIMIT,
  MAX_CHAT_BODY_BYTES,
} from '../../utils/limits';

export const prerender = false;

const STREAM_TIMEOUT_MS = 45_000;
const encoder = new TextEncoder();

export const POST: APIRoute = async ({ request }) => {
  let cleanupAbortWatch = () => {};

  try {
    const ip = getClientIp(request);
    const rate = await checkRateLimit(getRateLimitStore(), `chat:${ip}`, CHAT_RATE_LIMIT);
    if (!rate.allowed) {
      return jsonError(
        'Demasiadas solicitudes. Intenta de nuevo en unos segundos.',
        429,
        { 'Retry-After': String(rate.retryAfterSeconds) },
        'RATE_LIMITED',
      );
    }

    const sessionId = request.headers.get('x-chat-session');
    if (isChatGuardEnabled()) {
      const validSession = await isChatSessionValid(getChatSessionStore(), sessionId);
      if (!validSession) {
        return jsonError('Verificación de seguridad requerida', 401, {}, 'CHAT_SESSION_REQUIRED');
      }
    }

    // Second layer: per-session quota, so a shared IP is not pooled together.
    if (sessionId) {
      const sessionRate = await checkRateLimit(
        getRateLimitStore(),
        `chat:session:${sessionId}`,
        CHAT_PER_SESSION_RATE_LIMIT,
      );
      if (!sessionRate.allowed) {
        return jsonError(
          'Demasiadas solicitudes en esta conversación. Espera unos segundos.',
          429,
          { 'Retry-After': String(sessionRate.retryAfterSeconds) },
          'RATE_LIMITED',
        );
      }
    }

    const body = await readJsonBody(request, MAX_CHAT_BODY_BYTES);
    if (!body.ok) return jsonError(body.error, body.status, {}, body.code);

    let normalized: ReturnType<typeof normalizeChatRequest>;
    try {
      normalized = normalizeChatRequest(body.data);
    } catch (error) {
      if (error instanceof ChatValidationError) {
        return jsonError(error.message, 400, {}, 'INVALID_CHAT_REQUEST');
      }
      throw error;
    }

    const groq = getGroqClient(readEnvValue('GROQ_API_KEY'));
    const modelConfig =
      CHAT_MODELS.find((model) => model.id === normalized.modelId) ?? DEFAULT_MODEL;

    // System prompt is injected server-side; client roles are whitelisted above.
    const groqMessages = [
      { role: 'system' as const, content: PORTFOLIO_SYSTEM_PROMPT },
      ...normalized.turns,
    ];

    const upstream = new AbortController();
    const timeoutId = setTimeout(() => upstream.abort('timeout'), STREAM_TIMEOUT_MS);
    const onClientDisconnect = () => upstream.abort('client');
    request.signal.addEventListener('abort', onClientDisconnect);
    cleanupAbortWatch = () => {
      clearTimeout(timeoutId);
      request.signal.removeEventListener('abort', onClientDisconnect);
    };

    const completion = await groq.chat.completions.create(
      {
        messages: groqMessages,
        model: modelConfig.groqId,
        temperature: 0.7,
        max_tokens: 500,
        stream: true,
      },
      { signal: upstream.signal },
    );

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const emit = (event: string, data: unknown) => {
          try {
            controller.enqueue(encoder.encode(formatSseEvent(event, data)));
          } catch {
            // Client disconnected mid-write; upstream abort ends the loop.
          }
        };

        try {
          for await (const chunk of completion) {
            if (upstream.signal.aborted) break;
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) emit('delta', { text: content });
          }

          if (upstream.signal.reason === 'timeout') {
            emit('error', {
              code: 'TIMEOUT',
              message: 'La respuesta tardó demasiado. Intenta de nuevo.',
            });
          } else if (upstream.signal.reason !== 'client') {
            emit('done', {});
          }
        } catch (error) {
          if (upstream.signal.reason === 'timeout') {
            emit('error', {
              code: 'TIMEOUT',
              message: 'La respuesta tardó demasiado. Intenta de nuevo.',
            });
          } else if (upstream.signal.reason !== 'client') {
            console.error('Stream generation error:', error);
            emit('error', {
              code: 'STREAM_FAILED',
              message: 'La generación se interrumpió. Puedes reintentar.',
            });
          }
        } finally {
          cleanupAbortWatch();
          try {
            controller.close();
          } catch {
            // Already closed or cancelled by the client.
          }
        }
      },
      cancel(reason) {
        upstream.abort(reason ?? 'client');
        cleanupAbortWatch();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        'X-RateLimit-Limit': String(rate.limit),
        'X-RateLimit-Remaining': String(rate.remaining),
      },
    });
  } catch (error) {
    cleanupAbortWatch();
    console.error('Groq API Endpoint Error:', error);
    return jsonError('No se pudo procesar la solicitud', 500);
  }
};
