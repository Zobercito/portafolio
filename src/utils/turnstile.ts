export interface TurnstileVerifyResult {
  success: boolean;
  errorCodes?: string[];
}

export interface TurnstileVerifyOptions {
  fetchImpl?: typeof fetch;
  remoteIp?: string;
}

/**
 * Validates a Turnstile token against Cloudflare's siteverify endpoint.
 * Network failures are reported as an unsuccessful verification instead of
 * throwing, so callers can log `errorCodes` without leaking them to clients.
 */
export async function verifyTurnstileToken(
  token: string | undefined | null,
  secret: string | undefined | null,
  options: TurnstileVerifyOptions = {},
): Promise<TurnstileVerifyResult> {
  if (!token || !secret) {
    return { success: false, errorCodes: ['missing-input'] };
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const body = new URLSearchParams({ secret, response: token });
  if (options.remoteIp) body.set('remoteip', options.remoteIp);

  try {
    const response = await fetchImpl(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      },
    );

    if (!response.ok) {
      return { success: false, errorCodes: [`http-${response.status}`] };
    }

    const data = (await response.json()) as {
      success?: boolean;
      'error-codes'?: string[];
    };

    return {
      success: Boolean(data.success),
      errorCodes: data['error-codes'],
    };
  } catch {
    return { success: false, errorCodes: ['fetch-error'] };
  }
}
