/**
 * Cabeceras de seguridad que pone el middleware sobre las respuestas del
 * Worker (API y páginas renderizadas en cada petición).
 *
 * La política de CSP se aplica de verdad, no en modo `Report-Only`. Para que
 * esto funcione, `script-src` no lleva `'unsafe-inline'`: los pocos scripts
 * inline que hay van autorizados por su hash. En las páginas prerenderizadas
 * esos hashes los añade `scripts/apply-csp.mjs` sobre `dist/client/_headers`
 * después del build; aquí no hacen falta porque las respuestas del Worker (JSON
 * de API y el 404) no meten scripts inline en el documento.
 *
 * `style-src` sí conserva `'unsafe-inline'`: el HTML lleva decenas de
 * atributos `style=` (posicionamiento del canvas, rellenos de los SVG) y un
 * hash por atributo no es viable. Autorizar CSS no ejecuta código; el riesgo
 * que se cierra con esta política es el JavaScript inline.
 *
 * Mantener en sincronía con `public/_headers`, que cubre la landing
 * prerenderizada y los assets estáticos (aquí el middleware no llega a correr).
 */

export function buildContentSecurityPolicy(scriptHashes: readonly string[] = []): string {
  // Las expresiones de origen con base64 van entre comillas simples: `+`, `/` y
  // `=` no son caracteres válidos sin entrecomillar y el navegador descartaría
  // la política entera.
  const scriptSrc = [
    "'self'",
    ...scriptHashes.map((hash) => `'${hash}'`),
    'https://challenges.cloudflare.com',
  ].join(' ');

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https://cdn.jsdelivr.net https://github.com",
    "media-src 'self'",
    "connect-src 'self' https://challenges.cloudflare.com",
    "frame-src https://challenges.cloudflare.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ].join('; ');
}

export const CONTENT_SECURITY_POLICY = buildContentSecurityPolicy();

export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
};
