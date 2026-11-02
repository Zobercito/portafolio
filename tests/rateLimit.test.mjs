import test from 'node:test';
import assert from 'node:assert/strict';

import {
  checkRateLimit,
  createKvRateLimitStore,
  createMemoryRateLimitStore,
} from '../src/utils/rateLimit.ts';

test('permite hasta el límite y bloquea la siguiente petición', async () => {
  const store = createMemoryRateLimitStore(() => 1000);

  for (let i = 0; i < 3; i += 1) {
    const result = await checkRateLimit(store, 'ip-1', {
      limit: 3,
      windowMs: 1000,
      now: 1000,
    });
    assert.equal(result.allowed, true);
    assert.equal(result.remaining, 2 - i);
  }

  const blocked = await checkRateLimit(store, 'ip-1', {
    limit: 3,
    windowMs: 1000,
    now: 1200,
  });

  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.equal(blocked.retryAfterSeconds, 1);
});

test('reinicia el contador al cambiar de ventana', async () => {
  const store = createMemoryRateLimitStore(() => 1000);

  await checkRateLimit(store, 'ip-2', { limit: 1, windowMs: 1000, now: 1000 });
  const blocked = await checkRateLimit(store, 'ip-2', {
    limit: 1,
    windowMs: 1000,
    now: 1500,
  });
  assert.equal(blocked.allowed, false);

  const nextWindow = await checkRateLimit(store, 'ip-2', {
    limit: 1,
    windowMs: 1000,
    now: 2100,
  });
  assert.equal(nextWindow.allowed, true);
  assert.equal(nextWindow.remaining, 0);
});

test('aísla claves distintas', async () => {
  const store = createMemoryRateLimitStore(() => 1000);

  await checkRateLimit(store, 'ip-a', { limit: 1, windowMs: 1000, now: 1000 });
  const other = await checkRateLimit(store, 'ip-b', {
    limit: 1,
    windowMs: 1000,
    now: 1000,
  });

  assert.equal(other.allowed, true);
});

test('ventana deslizante: los buckets antiguos salen del cómputo gradualmente', async () => {
  let now = 0;
  const store = createMemoryRateLimitStore(() => now);
  const options = () => ({ limit: 2, windowMs: 3000, now });

  now = 100;
  assert.equal((await checkRateLimit(store, 'ip-slide', options())).allowed, true);
  now = 1100;
  assert.equal((await checkRateLimit(store, 'ip-slide', options())).allowed, true);

  // Los dos primeros requests siguen dentro de la ventana de 3 s.
  now = 2100;
  const blocked = await checkRateLimit(store, 'ip-slide', options());
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 1);

  // Al cumplir la ventana, el primer request (t=100) sale y entra uno nuevo.
  now = 3100;
  const allowed = await checkRateLimit(store, 'ip-slide', options());
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.remaining, 0);
});

test('el store en memoria expira entradas con el TTL', async () => {
  let now = 0;
  const store = createMemoryRateLimitStore(() => now);

  await store.put('k', '1', { expirationTtl: 1 });
  assert.equal(await store.get('k'), '1');

  now = 2000;
  assert.equal(await store.get('k'), null);
});

test('el store de KV delega get/put con las opciones recibidas', async () => {
  const calls = [];
  const values = new Map();
  const kv = {
    async get(key) {
      calls.push(['get', key]);
      return values.get(key) ?? null;
    },
    async put(key, value, options) {
      calls.push(['put', key, value, options]);
      values.set(key, value);
    },
  };

  const store = createKvRateLimitStore(kv);
  await checkRateLimit(store, 'ip-kv', { limit: 5, windowMs: 60_000, now: 0 });

  assert.deepEqual(calls[0], ['get', 'rate-limit:ip-kv:0']);
  assert.equal(calls[1][0], 'put');
  assert.equal(calls[1][2], '1');
  // TTL cubre la ventana completa más un bucket de holgura (60 s + 10 s).
  assert.equal(calls[1][3].expirationTtl, 70);
});
