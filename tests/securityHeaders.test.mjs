import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  CONTENT_SECURITY_POLICY,
  SECURITY_HEADERS,
  buildContentSecurityPolicy,
} from '../src/utils/securityHeaders.ts';

test('aplica las cabeceras de seguridad básicas', () => {
  assert.equal(SECURITY_HEADERS['X-Content-Type-Options'], 'nosniff');
  assert.equal(SECURITY_HEADERS['X-Frame-Options'], 'DENY');
  assert.equal(
    SECURITY_HEADERS['Referrer-Policy'],
    'strict-origin-when-cross-origin',
  );
  assert.match(SECURITY_HEADERS['Strict-Transport-Security'], /max-age=/);
  assert.match(SECURITY_HEADERS['Permissions-Policy'], /camera=\(\)/);
});

test('la CSP se aplica, no sólo se informa', () => {
  assert.equal(SECURITY_HEADERS['Content-Security-Policy'], CONTENT_SECURITY_POLICY);
  assert.equal(SECURITY_HEADERS['Content-Security-Policy-Report-Only'], undefined);
});

test('script-src no permite código inline sin hash', () => {
  assert.doesNotMatch(CONTENT_SECURITY_POLICY, /script-src[^;]*unsafe-inline/);
  assert.match(CONTENT_SECURITY_POLICY, /script-src 'self' https:\/\/challenges\.cloudflare\.com/);
});

test('los hashes de script van entrecomillados y en orden', () => {
  const policy = buildContentSecurityPolicy(['sha256-abc=', 'sha256-def/g+']);
  assert.match(
    policy,
    /script-src 'self' 'sha256-abc=' 'sha256-def\/g\+' https:\/\/challenges\.cloudflare\.com/,
  );
  // Sin hashes la política del Worker (API y 404) no menciona `sha256`.
  assert.doesNotMatch(buildContentSecurityPolicy(), /sha256/);
});

test('style-src admite los atributos style= del HTML prerenderizado', () => {
  // El canvas, el track del slider y los SVG de los iconos llevan `style=` en
  // el marcado; autorizar CSS no ejecuta JavaScript.
  assert.match(CONTENT_SECURITY_POLICY, /style-src 'self' 'unsafe-inline'/);
});

test('la CSP permite Turnstile y ya no abre el formulario a Web3Forms', () => {
  assert.match(CONTENT_SECURITY_POLICY, /script-src[^;]*challenges\.cloudflare\.com/);
  assert.match(CONTENT_SECURITY_POLICY, /frame-src https:\/\/challenges\.cloudflare\.com/);
  assert.match(CONTENT_SECURITY_POLICY, /connect-src[^;]*challenges\.cloudflare\.com/);
  assert.match(CONTENT_SECURITY_POLICY, /form-action 'self'/);
  assert.match(CONTENT_SECURITY_POLICY, /img-src[^;]*cdn\.jsdelivr\.net/);
  assert.doesNotMatch(CONTENT_SECURITY_POLICY, /web3forms\.com/);
});

test('la CSP deja cargar el avatar de GitHub de la tarjeta de actividad', () => {
  // github.com/<usuario>.png responde 302 a avatars.githubusercontent.com y CSP
  // evalúa también el destino de la redirección.
  assert.match(CONTENT_SECURITY_POLICY, /img-src[^;]*github\.com/);
  assert.match(CONTENT_SECURITY_POLICY, /img-src[^;]*avatars\.githubusercontent\.com/);
});

test('la CSP autoriza el beacon de Web Analytics de Cloudflare', () => {
  // Lo inyecta el edge al servir, no está en el HTML: si no se autoriza, el
  // dashboard deja de contar visitas sin ningún error visible en la página.
  assert.match(CONTENT_SECURITY_POLICY, /script-src[^;]*static\.cloudflareinsights\.com/);
  assert.match(CONTENT_SECURITY_POLICY, /connect-src[^;]*https:\/\/cloudflareinsights\.com/);
});

test('public/_headers y el constructor de la CSP no divergen', () => {
  // El build reescribe la línea de dist con los hashes, pero el fichero del repo
  // es el punto de partida legible: si alguien añade un origen a uno y no al
  // otro, la diferencia se pierde al servir la landing.
  const headers = readFileSync(
    new URL('../public/_headers', import.meta.url),
    'utf8',
  );
  const linea = headers.match(/^ {2}Content-Security-Policy: (.+)$/m)?.[1];
  assert.ok(linea, 'public/_headers debe tener la línea de Content-Security-Policy');
  const sinHashes = (policy) =>
    policy
      .split('; ')
      .map((directiva) => directiva.split(' ').filter((p) => !p.startsWith("'sha256-")).join(' '))
      .join('; ');
  assert.equal(sinHashes(linea), sinHashes(CONTENT_SECURITY_POLICY));
});

test('la CSP ya no depende de Google Fonts', () => {
  assert.doesNotMatch(CONTENT_SECURITY_POLICY, /fonts\.googleapis\.com/);
  assert.doesNotMatch(CONTENT_SECURITY_POLICY, /fonts\.gstatic\.com/);
  assert.match(CONTENT_SECURITY_POLICY, /font-src 'self' data:/);
});

test('la CSP declara defaults restrictivos', () => {
  assert.match(CONTENT_SECURITY_POLICY, /default-src 'self'/);
  assert.match(CONTENT_SECURITY_POLICY, /object-src 'none'/);
  assert.match(CONTENT_SECURITY_POLICY, /frame-ancestors 'none'/);
  assert.match(CONTENT_SECURITY_POLICY, /media-src 'self'/);
});

test('la CSP no declara destinos de reporte que no existen', () => {
  // Sin collector no tiene sentido prometer reportes: los navegadores sólo los
  // enviarían si la política se rompiera, y ahí preferimos un fallo visible.
  assert.doesNotMatch(CONTENT_SECURITY_POLICY, /report-(uri|to)/);
  assert.doesNotMatch(CONTENT_SECURITY_POLICY, /upgrade-insecure-requests/);
});
