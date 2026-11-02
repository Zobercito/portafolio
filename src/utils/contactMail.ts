export interface ContactMailInput {
  name: string;
  email: string;
  message: string;
}

export interface ContactMailConfig {
  apiKey: string;
  from: string;
  to: string;
}

interface ResendEnvSlice {
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  CONTACT_TO_EMAIL?: string;
}

type FetchLike = typeof fetch;

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/** Returns the server-side mailer config, or null when it is not configured. */
export function resolveContactMailConfig(env: ResendEnvSlice): ContactMailConfig | null {
  const { RESEND_API_KEY, RESEND_FROM, CONTACT_TO_EMAIL } = env;
  if (!RESEND_API_KEY || !RESEND_FROM || !CONTACT_TO_EMAIL) return null;
  return { apiKey: RESEND_API_KEY, from: RESEND_FROM, to: CONTACT_TO_EMAIL };
}

/**
 * Sends the contact message from the Worker so no mail credential ever
 * reaches the browser. `reply_to` carries the visitor address so replies go
 * to them while the envelope sender stays on our verified domain.
 */
export async function sendContactMail(
  config: ContactMailConfig,
  input: ContactMailInput,
  fetchImpl: FetchLike = fetch,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await fetchImpl(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.from,
        to: [config.to],
        reply_to: `${input.name} <${input.email}>`,
        subject: `Nuevo mensaje de ${input.name} desde Portafolio`,
        text: `Nombre: ${input.name}\nEmail: ${input.email}\n\n${input.message}`,
      }),
    });

    if (!response.ok) {
      let message = `El envío de correo falló (${response.status})`;
      try {
        const data = (await response.json()) as { message?: string };
        if (data?.message) message = `El envío de correo falló: ${data.message}`;
      } catch {
        // Keep the generic message.
      }
      return { ok: false, error: message };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo enviar el correo. Intenta de nuevo.' };
  }
}
