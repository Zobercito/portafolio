export interface JsonBodySuccess {
  ok: true;
  data: unknown;
}

export interface JsonBodyFailure {
  ok: false;
  status: number;
  error: string;
  code?: string;
}

export type JsonBodyResult = JsonBodySuccess | JsonBodyFailure;

/**
 * Reads and parses a JSON request body while enforcing a hard byte cap.
 * `Content-Length` is checked first; the actual payload is measured again
 * because the header can be missing or spoofed.
 */
export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<JsonBodyResult> {
  const contentLength = request.headers.get('content-length');
  if (contentLength !== null) {
    const declared = Number(contentLength);
    if (Number.isFinite(declared) && declared > maxBytes) {
      return { ok: false, status: 413, error: 'Solicitud demasiado grande', code: 'PAYLOAD_TOO_LARGE' };
    }
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return { ok: false, status: 400, error: 'No se pudo leer la solicitud', code: 'INVALID_BODY' };
  }

  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    return { ok: false, status: 413, error: 'Solicitud demasiado grande', code: 'PAYLOAD_TOO_LARGE' };
  }

  if (!text.trim()) {
    return { ok: false, status: 400, error: 'Cuerpo de la solicitud requerido', code: 'EMPTY_BODY' };
  }

  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400, error: 'JSON inválido', code: 'INVALID_JSON' };
  }
}

export function jsonResponse(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders,
    },
  });
}

export function jsonError(
  message: string,
  status: number,
  extraHeaders: Record<string, string> = {},
  code?: string,
): Response {
  return jsonResponse(code ? { error: message, code } : { error: message }, status, extraHeaders);
}

export function getClientIp(request: Request): string {
  const direct =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-real-ip');
  if (direct) return direct.trim();

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  return 'unknown';
}
