import test from 'node:test';
import assert from 'node:assert/strict';

import { cleanTitle, FALLBACK_TITLE } from '../src/utils/titleCleanup.ts';

test('recorta espacios y comillas exteriores', () => {
  assert.equal(cleanTitle('  "Mi experiencia"  '), 'Mi experiencia');
  assert.equal(cleanTitle("'Proyectos con Astro'"), 'Proyectos con Astro');
  assert.equal(cleanTitle('«Sobre mí»'), 'Sobre mí');
  assert.equal(cleanTitle('“Chat IA”'), 'Chat IA');
});

test('conserva comillas internas', () => {
  assert.equal(cleanTitle('El "backend" de Francisco'), 'El "backend" de Francisco');
});

test('devuelve el fallback con entradas vacías', () => {
  assert.equal(cleanTitle(''), FALLBACK_TITLE);
  assert.equal(cleanTitle('   '), FALLBACK_TITLE);
  assert.equal(cleanTitle('""'), FALLBACK_TITLE);
  assert.equal(cleanTitle(null), FALLBACK_TITLE);
  assert.equal(cleanTitle(undefined), FALLBACK_TITLE);
});
