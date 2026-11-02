import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveContactMailConfig,
  sendContactMail,
} from '../src/utils/contactMail.ts';

const config = { apiKey: 're-test', from: 'site@zobercito.dev', to: 'fran@zobercito.dev' };
const input = { name: 'Ana', email: 'ana@example.com', message: 'Hola' };

test('la config de Resend exige las tres variables', () => {
  assert.equal(resolveContactMailConfig({}), null);
  assert.equal(resolveContactMailConfig({ RESEND_API_KEY: 'k' }), null);
  assert.equal(
    resolveContactMailConfig({ RESEND_API_KEY: 'k', RESEND_FROM: 'a@b.dev' }),
    null,
  );
  assert.deepEqual(
    resolveContactMailConfig({
      RESEND_API_KEY: 'k',
      RESEND_FROM: 'a@b.dev',
      CONTACT_TO_EMAIL: 'c@b.dev',
    }),
    { apiKey: 'k', from: 'a@b.dev', to: 'c@b.dev' },
  );
});

test('sendContactMail envía el correo con auth y reply_to del visitante', async () => {
  let captured;
  const fakeFetch = async (url, init) => {
    captured = { url, init };
    return new Response(JSON.stringify({ id: 'email-1' }), { status: 200 });
  };

  const result = await sendContactMail(config, input, fakeFetch);
  assert.deepEqual(result, { ok: true });
  assert.equal(captured.url, 'https://api.resend.com/emails');
  assert.equal(captured.init.method, 'POST');
  assert.equal(captured.init.headers.Authorization, 'Bearer re-test');

  const body = JSON.parse(captured.init.body);
  assert.equal(body.from, 'site@zobercito.dev');
  assert.deepEqual(body.to, ['fran@zobercito.dev']);
  assert.equal(body.reply_to, 'Ana <ana@example.com>');
  assert.match(body.text, /Nombre: Ana/);
  assert.match(body.text, /Hola/);
});

test('sendContactMail reporta el error de Resend', async () => {
  const fakeFetch = async () =>
    new Response(JSON.stringify({ message: 'dominio no verificado' }), { status: 422 });

  const result = await sendContactMail(config, input, fakeFetch);
  assert.equal(result.ok, false);
  assert.match(result.error, /dominio no verificado/);
});

test('sendContactMail no deja escapar errores de red', async () => {
  const fakeFetch = async () => {
    throw new Error('boom');
  };

  const result = await sendContactMail(config, input, fakeFetch);
  assert.equal(result.ok, false);
  assert.match(result.error, /No se pudo enviar/);
});
