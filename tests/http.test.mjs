import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getClientIp,
  jsonError,
  jsonResponse,
  readJsonBody,
} from '../src/utils/http.ts';

function jsonRequest(body, headers = {}) {
  return new Request('https://example.test/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body,
  });
}

test('lee y parsea un cuerpo JSON válido', async () => {
  const result = await readJsonBody(jsonRequest('{"ok":true}'), 1024);
  assert.deepEqual(result, { ok: true, data: { ok: true } });
});

test('rechaza cuerpos vacíos', async () => {
  const result = await readJsonBody(jsonRequest('   '), 1024);
  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
  assert.equal(result.code, 'EMPTY_BODY');
});

test('rechaza JSON inválido', async () => {
  const result = await readJsonBody(jsonRequest('{nope'), 1024);
  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
  assert.equal(result.code, 'INVALID_JSON');
});

test('rechaza por Content-Length declarado', async () => {
  const result = await readJsonBody(
    jsonRequest('{"a":1}', { 'Content-Length': '5000' }),
    1024,
  );
  assert.equal(result.ok, false);
  assert.equal(result.status, 413);
  assert.equal(result.code, 'PAYLOAD_TOO_LARGE');
});

test('mide bytes reales cuando falta Content-Length', async () => {
  const body = `"${'ñ'.repeat(10)}"`; // 12 chars / 22 bytes en UTF-8
  const result = await readJsonBody(jsonRequest(body), 10);
  assert.equal(result.ok, false);
  assert.equal(result.status, 413);
});

test('jsonResponse agrega el content-type JSON', () => {
  const response = jsonResponse({ hello: 'world' }, 201);
  assert.equal(response.status, 201);
  assert.equal(
    response.headers.get('Content-Type'),
    'application/json; charset=utf-8',
  );
});

test('jsonError incluye código cuando se fornece', async () => {
  const response = jsonError('boom', 429, { 'Retry-After': '5' }, 'RATE_LIMITED');
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '5');
  assert.deepEqual(await response.json(), {
    error: 'boom',
    code: 'RATE_LIMITED',
  });
});

test('getClientIp prioriza cf-connecting-ip', () => {
  const request = new Request('https://example.test', {
    headers: {
      'cf-connecting-ip': '198.51.100.7',
      'x-real-ip': '198.51.100.8',
      'x-forwarded-for': '198.51.100.9, 10.0.0.1',
    },
  });

  assert.equal(getClientIp(request), '198.51.100.7');
});

test('getClientIp usa el primer valor de x-forwarded-for', () => {
  const request = new Request('https://example.test', {
    headers: { 'x-forwarded-for': ' 198.51.100.9 , 10.0.0.1' },
  });

  assert.equal(getClientIp(request), '198.51.100.9');
});

test('getClientIp devuelve unknown sin cabeceras', () => {
  const request = new Request('https://example.test');
  assert.equal(getClientIp(request), 'unknown');
});
