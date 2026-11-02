/**
 * Hashes de los scripts inline de una página, en el formato que entiende CSP.
 *
 * El sitio se sirve con una `Content-Security-Policy` que aplica. Astro mete en
 * el HTML varios scripts inline (los cargadores de las islas) y `index.astro`
 * lleva uno propio, así que en lugar de permitir `'unsafe-inline'` se listan los
 * `sha256-…` de ese texto exacto. Se calculan después del build, cuando el HTML
 * ya existe: ver `scripts/apply-csp.mjs`.
 *
 * Solo se hashan los scripts que el navegador ejecutaría. Los bloques de datos
 * (`application/ld+json`, import maps) no los mira `script-src`.
 */

const SCRIPT_TYPES_JS = new Set([
  '',
  'module',
  'text/javascript',
  'application/javascript',
  'application/ecmascript',
  'text/ecmascript',
]);

const SCRIPT_TAG = /<script([^>]*)>([\s\S]*?)<\/script\s*>/gi;

export interface InlineScript {
  /** El texto exacto entre `<script>` y `</script>`, sin recortar. */
  code: string;
}

function isExecutableScript(attributes: string): boolean {
  if (/\bsrc\s*=/i.test(attributes)) return false;
  const typeMatch = /\btype\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>/]+))/i.exec(attributes);
  const type = (typeMatch?.[2] ?? typeMatch?.[3] ?? typeMatch?.[4] ?? '').trim().toLowerCase();
  return SCRIPT_TYPES_JS.has(type);
}

/** Todos los scripts inline ejecutables del HTML, en orden de aparición. */
export function extractInlineScripts(html: string): InlineScript[] {
  const found: InlineScript[] = [];
  SCRIPT_TAG.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = SCRIPT_TAG.exec(html)) !== null) {
    if (!isExecutableScript(match[1])) continue;
    found.push({ code: match[2] });
  }
  return found;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** `'sha256-<base64>'` del UTF-8 recibido, tal cual lo hasharía el navegador. */
export async function cspHash(source: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  return `sha256-${toBase64(new Uint8Array(digest))}`;
}

/** Hashes únicos, listos para meter en `script-src`. */
export async function cspHashesForHtml(html: string): Promise<string[]> {
  const hashes = await Promise.all(extractInlineScripts(html).map((s) => cspHash(s.code)));
  return [...new Set(hashes)];
}
