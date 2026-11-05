import test from 'node:test';
import assert from 'node:assert/strict';

import { splitByLinks } from '../src/utils/linkify.ts';

test('sin enlaces devuelve el texto completo', () => {
  assert.deepEqual(splitByLinks('Hola mundo'), [{ text: 'Hola mundo' }]);
});

test('separa el texto y marca el enlace', () => {
  assert.deepEqual(
    splitByLinks('Disponible en adopty.lat hoy.', [
      { text: 'adopty.lat', url: 'https://adopty.lat' },
    ]),
    [
      { text: 'Disponible en ' },
      { text: 'adopty.lat', url: 'https://adopty.lat' },
      { text: ' hoy.' },
    ]
  );
});

test('enlace al final del texto', () => {
  assert.deepEqual(
    splitByLinks('Ver adopty.lat', [{ text: 'adopty.lat', url: 'https://adopty.lat' }]),
    [{ text: 'Ver ' }, { text: 'adopty.lat', url: 'https://adopty.lat' }]
  );
});

test('escapa caracteres especiales del texto del enlace', () => {
  const segments = splitByLinks('Usa a+b (ok)', [{ text: 'a+b (ok)', url: 'https://x.dev' }]);
  assert.deepEqual(segments, [{ text: 'Usa ' }, { text: 'a+b (ok)', url: 'https://x.dev' }]);
});

test('si el texto del enlace no aparece, no cambia nada', () => {
  assert.deepEqual(splitByLinks('Sin coincidencias', [{ text: 'otro', url: 'https://x.dev' }]), [
    { text: 'Sin coincidencias' },
  ]);
});
