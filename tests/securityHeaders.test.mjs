import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CONTENT_SECURITY_POLICY,
  SECURITY_HEADERS,
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

test('la CSP permite Turnstile y ya no abre el formulario a Web3Forms', () => {
  assert.match(CONTENT_SECURITY_POLICY, /script-src[^;]*challenges\.cloudflare\.com/);
  assert.match(CONTENT_SECURITY_POLICY, /frame-src https:\/\/challenges\.cloudflare\.com/);
  assert.match(CONTENT_SECURITY_POLICY, /connect-src[^;]*challenges\.cloudflare\.com/);
  assert.match(CONTENT_SECURITY_POLICY, /form-action 'self'/);
  assert.match(CONTENT_SECURITY_POLICY, /img-src[^;]*cdn\.jsdelivr\.net/);
  assert.doesNotMatch(CONTENT_SECURITY_POLICY, /web3forms\.com/);
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

test('la CSP no incluye directivas ignoradas en modo Report-Only', () => {
  // Browsers discard upgrade-insecure-requests when the policy is report-only.
  assert.doesNotMatch(CONTENT_SECURITY_POLICY, /upgrade-insecure-requests/);
});
