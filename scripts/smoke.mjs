/**
 * Comprobaciones de humo sobre un despliegue real.
 *
 * Uso: node scripts/smoke.mjs [baseURL]   (por defecto https://zobercito.dev)
 *
 * Sólo lectura y las rutas de guardia que deben rechazar la petición: el
 * chat y el contacto envían un token de Turnstile falso, así que no se manda
 * ningún correo ni se gasta cuota de Groq.
 */
import { cspHash, extractInlineScripts } from '../src/utils/cspHashes.ts';

const BASE_URL = (process.argv[2] || process.env.SMOKE_BASE_URL || 'https://zobercito.dev')
  .replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = 20_000;

async function request(path, init = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    redirect: init.redirect ?? 'manual',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // Las respuestas HTML se quedan sólo con `text`.
  }
  return { status: response.status, headers: response.headers, text, json };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertJsonError(response, status, code) {
  assert(
    response.status === status,
    `esperaba ${status}, llegó ${response.status}: ${response.text.slice(0, 200)}`,
  );
  assert(response.json?.code === code, `esperaba code=${code}, llegó ${JSON.stringify(response.json)}`);
}

const post = (body) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

const checks = [
  [
    'landing servida con cabeceras de seguridad',
    async () => {
      const res = await request('/');
      assert(res.status === 200, `esperaba 200, llegó ${res.status}`);
      assert(res.headers.get('content-type')?.includes('text/html'), 'content-type no es HTML');
      assert(/<title>[^<]+<\/title>/.test(res.text), 'el HTML no tiene <title>');
      assert(res.text.includes('astro-island'), 'no hay islas de React en el HTML');
      for (const header of [
        'strict-transport-security',
        'x-content-type-options',
        'x-frame-options',
        'referrer-policy',
        'permissions-policy',
      ]) {
        assert(res.headers.get(header), `falta la cabecera ${header}`);
      }

      // La CSP puede llegar aún en modo Report-Only en despliegues viejos; si ya
      // aplica, cada script inline del HTML tiene que estar autorizado por hash.
      const csp =
        res.headers.get('content-security-policy') ??
        res.headers.get('content-security-policy-report-only');
      assert(csp, 'falta la cabecera Content-Security-Policy');
      const enforcing = res.headers.get('content-security-policy');
      if (enforcing) {
        assert(!/script-src[^;]*unsafe-inline/.test(enforcing), 'script-src sigue con unsafe-inline');
        const scriptHashes = await Promise.all(
          extractInlineScripts(res.text).map((script) => cspHash(script.code)),
        );
        assert(scriptHashes.length > 0, 'el HTML no trae scripts inline que comprobar');
        for (const hash of scriptHashes) {
          assert(
            enforcing.includes(`'${hash}'`),
            `el script inline ${hash} no está en la CSP y no hidratará`,
          );
        }
      }
      assert(!res.text.includes('Internal Server Error'), 'la landing devolvió un error interno');
    },
  ],
  [
    'assets con cache immutable',
    async () => {
      const { text } = await request('/');
      const asset = text.match(/\/_astro\/[\w.@/-]+\.(?:css|js)/)?.[0];
      assert(asset, 'la landing no referencia ningún asset de /_astro/');
      // Las rutas con `@` (los chunks de Astro) llegan con un 307 a su forma
      // escapada, así que aquí sí se siguen las redirecciones.
      const res = await request(asset, { redirect: 'follow' });
      assert(res.status === 200, `${asset} devolvió ${res.status}`);
      assert(
        /max-age=31536000/.test(res.headers.get('cache-control') ?? ''),
        `${asset} sin Cache-Control immutable: ${res.headers.get('cache-control')}`,
      );
    },
  ],
  [
    'config pública con sitekey y guard activado',
    async () => {
      const res = await request('/api/config');
      assert(res.status === 200, `esperaba 200, llegó ${res.status}`);
      assert(res.json?.turnstileSitekey, 'turnstileSitekey vacío: falta PUBLIC_TURNSTILE_SITE_KEY');
      assert(
        res.json?.chatGuardEnabled === true,
        'chatGuardEnabled debería ser true (TURNSTILE_SECRET_KEY sin configurar)',
      );
    },
  ],
  [
    'chat sin sesión rechazado',
    async () => {
      assertJsonError(await request('/api/chat', post({ turns: [] })), 401, 'CHAT_SESSION_REQUIRED');
    },
  ],
  [
    'sesión de chat con token inválido rechazada',
    async () => {
      assertJsonError(
        await request('/api/chat/session', post({ turnstileToken: 'smoke-token-invalido' })),
        403,
        'TURNSTILE_FAILED',
      );
    },
  ],
  [
    'contacto con token inválido rechazado',
    async () => {
      assertJsonError(
        await request(
          '/api/contact',
          post({
            name: 'Smoke',
            email: 'smoke@zobercito.dev',
            message: 'Comprobación automática de despliegue.',
            turnstileToken: 'smoke-token-invalido',
          }),
        ),
        403,
        'TURNSTILE_FAILED',
      );
    },
  ],
  [
    'sitemap, robots y 404',
    async () => {
      const sitemap = await request('/sitemap.xml');
      assert(sitemap.status === 200, `sitemap devolvió ${sitemap.status}`);
      assert(sitemap.text.includes('<urlset'), 'el sitemap no es un <urlset>');
      assert(sitemap.text.includes(`${BASE_URL}/`), 'el sitemap no incluye la raíz');
      const robots = await request('/robots.txt');
      assert(robots.status === 200, `robots devolvió ${robots.status}`);
      assert(/sitemap:/i.test(robots.text), 'robots.txt no anuncia el sitemap');
      const missing = await request('/no-existe-esta-ruta');
      assert(missing.status === 404, `esperaba 404 en una ruta inexistente, llegó ${missing.status}`);
    },
  ],
];

let failures = 0;
console.log(`Smoke sobre ${BASE_URL}`);
for (const [name, run] of checks) {
  try {
    await run();
    console.log(`  ok    ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`  FALLA ${name}: ${error instanceof Error ? error.message : error}`);
  }
}
console.log(`${checks.length - failures}/${checks.length} comprobaciones en verde`);
process.exit(failures === 0 ? 0 : 1);
