import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ContactValidationError,
  validateContactPayload,
} from '../src/utils/contactValidation.ts';

const validPayload = {
  name: '  Francisco  ',
  email: '  francisco@example.com ',
  message: '  Hola, me interesa tu perfil.  ',
  turnstileToken: '  token-123  ',
};

test('acepta un payload válido y recorta espacios', () => {
  assert.deepEqual(validateContactPayload(validPayload), {
    name: 'Francisco',
    email: 'francisco@example.com',
    message: 'Hola, me interesa tu perfil.',
    turnstileToken: 'token-123',
  });
});

test('rechaza payloads que no son objetos', () => {
  assert.throws(() => validateContactPayload(null), ContactValidationError);
  assert.throws(() => validateContactPayload('texto'), ContactValidationError);
  assert.throws(() => validateContactPayload([]), ContactValidationError);
});

test('rechaza campos requeridos ausentes o vacíos', () => {
  assert.throws(() => validateContactPayload({ ...validPayload, name: '' }), ContactValidationError);
  assert.throws(() => validateContactPayload({ ...validPayload, name: '   ' }), ContactValidationError);
  assert.throws(() => validateContactPayload({ ...validPayload, email: '' }), ContactValidationError);
  assert.throws(() => validateContactPayload({ ...validPayload, message: '' }), ContactValidationError);
  assert.throws(() => validateContactPayload({ ...validPayload, turnstileToken: '' }), ContactValidationError);
});

test('rechaza correos inválidos', () => {
  assert.throws(
    () => validateContactPayload({ ...validPayload, email: 'no-es-un-correo' }),
    ContactValidationError,
  );
  assert.throws(
    () => validateContactPayload({ ...validPayload, email: 'a@b' }),
    ContactValidationError,
  );
});

test('rechaza tipos incorrectos', () => {
  assert.throws(() => validateContactPayload({ ...validPayload, name: 123 }), ContactValidationError);
  assert.throws(() => validateContactPayload({ ...validPayload, message: {} }), ContactValidationError);
});

test('rechaza mensajes demasiado largos', () => {
  assert.throws(
    () => validateContactPayload({ ...validPayload, message: 'a'.repeat(5001) }),
    ContactValidationError,
  );
});
