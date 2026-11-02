import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isModelUnavailableError,
  modelCandidates,
  withModelFallback,
} from '../src/utils/groqFallback.ts';
import { CHAT_MODELS, DEFAULT_MODEL } from '../src/data/chatModels.ts';

class ModelGone extends Error {
  constructor(message = 'model not found') {
    super(message);
    this.status = 404;
    this.code = 'model_not_found';
  }
}

test('reconoce el retiro de un modelo por su código de Groq', () => {
  assert.equal(isModelUnavailableError(new ModelGone()), true);
});

test('reconoce el retiro de un modelo por status y mensaje', () => {
  const error = Object.assign(new Error('404 {"error":{"message":"The model `llama-3.1-8b-instant` does not exist or you do not have access to it."}}'), {
    status: 404,
  });
  assert.equal(isModelUnavailableError(error), true);
});

test('no confunde un fallo de modelo con rate limit o error interno', () => {
  assert.equal(isModelUnavailableError(Object.assign(new Error('rate limited'), { status: 429, code: 'rate_limit_exceeded' })), false);
  assert.equal(isModelUnavailableError(Object.assign(new Error('boom'), { status: 500 })), false);
  assert.equal(isModelUnavailableError(Object.assign(new Error('bad request'), { status: 400 })), false);
  assert.equal(isModelUnavailableError(null), false);
  assert.equal(isModelUnavailableError('string'), false);
});

test('los candidatos empiezan por el modelo pedido y no se repiten', () => {
  const preferred = CHAT_MODELS[CHAT_MODELS.length - 1];
  const candidates = modelCandidates(preferred);

  assert.equal(candidates[0], preferred);
  assert.equal(candidates.length, CHAT_MODELS.length);
  assert.deepEqual(
    candidates.map((model) => model.groqId),
    [...new Set([preferred.groqId, DEFAULT_MODEL.groqId, ...CHAT_MODELS.map((model) => model.groqId)])],
  );
});

test('usa el modelo pedido cuando responde', async () => {
  const calls = [];
  const outcome = await withModelFallback(CHAT_MODELS, (model) => {
    calls.push(model.groqId);
    return Promise.resolve(`ok:${model.groqId}`);
  });

  assert.equal(outcome.result, `ok:${CHAT_MODELS[0].groqId}`);
  assert.equal(outcome.fellBack, false);
  assert.deepEqual(calls, [CHAT_MODELS[0].groqId]);
});

test('reintenta con el siguiente modelo si el primero fue retirado', async () => {
  assert.ok(CHAT_MODELS.length >= 2, 'se necesitan dos modelos en el catálogo');
  const calls = [];
  const notices = [];

  const outcome = await withModelFallback(
    CHAT_MODELS,
    (model) => {
      calls.push(model.groqId);
      if (calls.length === 1) return Promise.reject(new ModelGone());
      return Promise.resolve(`ok:${model.groqId}`);
    },
    (failed, next) => notices.push([failed.groqId, next.groqId]),
  );

  assert.equal(outcome.model, CHAT_MODELS[1]);
  assert.equal(outcome.fellBack, true);
  assert.deepEqual(calls, CHAT_MODELS.slice(0, 2).map((model) => model.groqId));
  assert.deepEqual(notices, [[CHAT_MODELS[0].groqId, CHAT_MODELS[1].groqId]]);
});

test('no reintenta ante un error que no depende del modelo', async () => {
  const calls = [];
  const rateLimited = Object.assign(new Error('rate limited'), { status: 429 });

  await assert.rejects(
    withModelFallback(CHAT_MODELS, (model) => {
      calls.push(model.groqId);
      return Promise.reject(rateLimited);
    }),
    (error) => error === rateLimited,
  );
  assert.deepEqual(calls, [CHAT_MODELS[0].groqId]);
});

test('propaga el último error cuando todo el catálogo está caído', async () => {
  const calls = [];
  const thrown = [];

  await assert.rejects(
    withModelFallback(
      CHAT_MODELS,
      (model) => {
        calls.push(model.groqId);
        return Promise.reject(new ModelGone(`fuera ${model.groqId}`));
      },
      (_failed, _next, error) => thrown.push(error),
    ),
    (error) => error instanceof ModelGone && error.message === `fuera ${CHAT_MODELS.at(-1).groqId}`,
  );

  assert.deepEqual(calls, CHAT_MODELS.map((model) => model.groqId));
  assert.equal(thrown.length, CHAT_MODELS.length - 1);
});
