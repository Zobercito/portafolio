import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeTitleRequest,
  TitleValidationError,
} from '../src/utils/titleValidation.ts';
import {
  MAX_TITLE_ASSISTANT_MESSAGE_LENGTH,
  MAX_TITLE_USER_MESSAGE_LENGTH,
} from '../src/utils/limits.ts';

test('recorta los mensajes y permite una respuesta vacía', () => {
  const result = normalizeTitleRequest({
    userMessage: '  Explícame JWT  ',
    assistantMessage: '   ',
  });

  assert.deepEqual(result, {
    userMessage: 'Explícame JWT',
    assistantMessage: '',
  });
});

test('exige el mensaje del usuario', () => {
  assert.throws(() => normalizeTitleRequest(null), TitleValidationError);
  assert.throws(() => normalizeTitleRequest({}), TitleValidationError);
  assert.throws(
    () => normalizeTitleRequest({ userMessage: '   ' }),
    TitleValidationError,
  );
});

test('rechaza un mensaje de usuario demasiado largo', () => {
  assert.throws(
    () =>
      normalizeTitleRequest({
        userMessage: 'a'.repeat(MAX_TITLE_USER_MESSAGE_LENGTH + 1),
      }),
    TitleValidationError,
  );
});

test('rechaza una respuesta de asistente demasiado larga', () => {
  assert.throws(
    () =>
      normalizeTitleRequest({
        userMessage: 'hola',
        assistantMessage: 'a'.repeat(MAX_TITLE_ASSISTANT_MESSAGE_LENGTH + 1),
      }),
    TitleValidationError,
  );
});

test('ignora campos con tipos incorrectos', () => {
  const result = normalizeTitleRequest({
    userMessage: 'hola',
    assistantMessage: 42,
  });

  assert.deepEqual(result, { userMessage: 'hola', assistantMessage: '' });
});
