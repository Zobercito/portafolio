import test from 'node:test';
import assert from 'node:assert/strict';

import { verifyTurnstileToken } from '../src/utils/turnstile.ts';

test('rechaza tokens o secretos ausentes sin llamar a la red', async () => {
  let called = false;
  const fetchImpl = async () => {
    called = true;
    return new Response('{}');
  };

  assert.deepEqual(await verifyTurnstileToken('', 'secret', { fetchImpl }), {
    success: false,
    errorCodes: ['missing-input'],
  });
  assert.deepEqual(await verifyTurnstileToken('token', '', { fetchImpl }), {
    success: false,
    errorCodes: ['missing-input'],
  });
  assert.equal(called, false);
});

test('envía token, secreto e IP al endpoint de siteverify', async () => {
  let request;
  const fetchImpl = async (url, init) => {
    request = { url, init };
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  };

  const result = await verifyTurnstileToken('tok', 'sec', {
    fetchImpl,
    remoteIp: '203.0.113.5',
  });

  assert.deepEqual(result, { success: true, errorCodes: undefined });
  assert.equal(
    request.url,
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  );
  assert.equal(request.init.method, 'POST');
  const body = request.init.body;
  assert.equal(body.get('secret'), 'sec');
  assert.equal(body.get('response'), 'tok');
  assert.equal(body.get('remoteip'), '203.0.113.5');
});

test('propaga los códigos de error de Cloudflare', async () => {
  const fetchImpl = async () =>
    new Response(
      JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] }),
      { status: 200 },
    );

  const result = await verifyTurnstileToken('tok', 'sec', { fetchImpl });
  assert.equal(result.success, false);
  assert.deepEqual(result.errorCodes, ['invalid-input-response']);
});

test('trata las respuestas HTTP no exitosas como fallo', async () => {
  const fetchImpl = async () => new Response('nope', { status: 502 });
  const result = await verifyTurnstileToken('tok', 'sec', { fetchImpl });
  assert.deepEqual(result, { success: false, errorCodes: ['http-502'] });
});

test('trata los errores de red como fallo', async () => {
  const fetchImpl = async () => {
    throw new Error('offline');
  };
  const result = await verifyTurnstileToken('tok', 'sec', { fetchImpl });
  assert.deepEqual(result, { success: false, errorCodes: ['fetch-error'] });
});
