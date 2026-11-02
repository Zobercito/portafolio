import type { APIRoute } from 'astro';
import { ContactValidationError, validateContactPayload } from '../../utils/contactValidation';
import { resolveContactMailConfig, sendContactMail } from '../../utils/contactMail';
import { getClientIp, jsonError, jsonResponse, readJsonBody } from '../../utils/http';
import { checkRateLimit } from '../../utils/rateLimit';
import { getRateLimitStore, readEnvValue } from '../../utils/env';
import { verifyTurnstileToken } from '../../utils/turnstile';
import { CONTACT_RATE_LIMIT, MAX_CONTACT_BODY_BYTES } from '../../utils/limits';
import type { ContactSuccessResponse } from '../../types/api';

export const prerender = false;

/**
 * POST /api/contact
 *
 * Validates the Turnstile token server-side and sends the mail from the
 * Worker via Resend, so no mail credential ever reaches the browser.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = getClientIp(request);
    const rate = await checkRateLimit(getRateLimitStore(), `contact:${ip}`, CONTACT_RATE_LIMIT);
    if (!rate.allowed) {
      return jsonError(
        'Demasiadas solicitudes. Intenta de nuevo más tarde.',
        429,
        { 'Retry-After': String(rate.retryAfterSeconds) },
        'RATE_LIMITED',
      );
    }

    const turnstileSecretKey = readEnvValue('TURNSTILE_SECRET_KEY');
    if (!turnstileSecretKey) {
      console.error('TURNSTILE_SECRET_KEY no configurada');
      return jsonError('Error en la configuración del servidor', 500);
    }

    const body = await readJsonBody(request, MAX_CONTACT_BODY_BYTES);
    if (!body.ok) return jsonError(body.error, body.status, {}, body.code);

    let payload: ReturnType<typeof validateContactPayload>;
    try {
      payload = validateContactPayload(body.data);
    } catch (error) {
      if (error instanceof ContactValidationError) {
        return jsonError(error.message, 400, {}, 'INVALID_CONTACT_REQUEST');
      }
      throw error;
    }

    const verification = await verifyTurnstileToken(
      payload.turnstileToken,
      turnstileSecretKey,
      { remoteIp: ip },
    );

    if (!verification.success) {
      console.error('Turnstile validation failed:', verification.errorCodes);
      return jsonError('Validación de seguridad fallida', 403, {}, 'TURNSTILE_FAILED');
    }

    const mailConfig = resolveContactMailConfig({
      RESEND_API_KEY: readEnvValue('RESEND_API_KEY'),
      RESEND_FROM: readEnvValue('RESEND_FROM'),
      CONTACT_TO_EMAIL: readEnvValue('CONTACT_TO_EMAIL'),
    });

    if (!mailConfig) {
      console.error('Faltan RESEND_API_KEY, RESEND_FROM o CONTACT_TO_EMAIL');
      return jsonError('Error en la configuración del servidor', 500);
    }

    const sent = await sendContactMail(mailConfig, {
      name: payload.name,
      email: payload.email,
      message: payload.message,
    });
    if (!sent.ok) {
      console.error('Contact mail send failed:', sent.error);
      return jsonError(sent.error, 502, {}, 'MAIL_SEND_FAILED');
    }

    const responseBody: ContactSuccessResponse = { success: true };
    return jsonResponse(responseBody);
  } catch (error) {
    console.error('Contact API error:', error);
    return jsonError('Error interno del servidor', 500);
  }
};
