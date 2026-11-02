import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CHAT_SESSION_TTL_SECONDS,
  createKvChatSessionStore,
  createMemoryChatSessionStore,
  isChatSessionId,
  isChatSessionValid,
  issueChatSession,
} from '../src/utils/chatSession.ts';

test('emite un UUID válido y lo marca como vigente', async () => {
  const store = createMemoryChatSessionStore(() => 1000);
  const sessionId = await issueChatSession(store);

  assert.match(
    sessionId,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );
  assert.equal(await isChatSessionValid(store, sessionId), true);
});

test('rechaza ids con formato inválido o desconocidos', async () => {
  const store = createMemoryChatSessionStore();
  const unknown = '00000000-0000-4000-8000-000000000000';

  assert.equal(isChatSessionId('no-es-uuid'), false);
  assert.equal(isChatSessionId(123), false);
  assert.equal(await isChatSessionValid(store, unknown), false);
  assert.equal(await isChatSessionValid(store, 'no-es-uuid'), false);
});

test('la sesión expira según el TTL', async () => {
  let now = 0;
  const store = createMemoryChatSessionStore(() => now);
  const sessionId = await issueChatSession(store);

  now = CHAT_SESSION_TTL_SECONDS * 1000 - 1;
  assert.equal(await isChatSessionValid(store, sessionId), true);

  now = CHAT_SESSION_TTL_SECONDS * 1000;
  assert.equal(await isChatSessionValid(store, sessionId), false);
});

test('el store KV prefija la clave y usa el TTL de sesión', async () => {
  const calls = [];
  const kv = {
    async get(_key) {
      calls.push(['get']);
      return null;
    },
    async put(key, value, options) {
      calls.push(['put', key, value, options]);
    },
  };

  const store = createKvChatSessionStore(kv);
  const sessionId = '11111111-1111-4111-8111-111111111111';
  await issueChatSession(store, sessionId);
  await isChatSessionValid(store, sessionId);

  assert.deepEqual(calls[0], [
    'put',
    `chat-session:${sessionId}`,
    '1',
    { expirationTtl: CHAT_SESSION_TTL_SECONDS },
  ]);
  assert.deepEqual(calls[1], ['get']);
});
