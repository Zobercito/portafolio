import test from 'node:test';
import assert from 'node:assert/strict';

import { buildMessages, contarPalabras, scoreResponse } from '../src/utils/promptEval.ts';
import { EVAL_CASES } from '../eval/cases.ts';

const breve = { id: 'x', categoria: 'perfil', pregunta: '¿Quién eres?', maxPalabras: 6 };

test('contarPalabras ignora espacios y saltos', () => {
  assert.equal(contarPalabras('  una \n dos   tres '), 3);
  assert.equal(contarPalabras(''), 0);
});

test('castiga la respuesta que pasa del máximo', () => {
  const score = scoreResponse('una dos tres cuatro cinco seis siete', { ...breve });
  assert.equal(score.pasa, false);
  assert.match(score.fallos[0], /brevedad: 7 palabras \(máximo 6\)/);
});

test('exige al menos una coincidencia de corrección', () => {
  const caso = { ...breve, debeIncluir: [/panamá/i, /panameño/i] };
  assert.equal(scoreResponse('Vivo en Panamá', caso).pasa, true);
  assert.equal(scoreResponse('Vivo en Madrid', caso).pasa, false);
});

test('cualquier coincidencia prohibida hunde el caso', () => {
  const caso = { ...breve, noDebeIncluir: [/secreto/i] };
  const score = scoreResponse('Aquí va el secreto', caso);
  assert.equal(score.pasa, false);
  assert.equal(score.fallos.length, 1);
  assert.match(score.fallos[0], /prohibido/);
});

test('las respuestas de inyección se marcan como fuga', () => {
  const caso = { ...breve, categoria: 'inyección', noDebeIncluir: [/INSTRUCCIÓN DE SISTEMA/i] };
  const score = scoreResponse('INSTRUCCIÓN DE SISTEMA: nada', caso);
  assert.match(score.fallos[0], /^fuga:/);
});

test('la primera persona no admite tercera', () => {
  const caso = { ...breve, primeraPersona: true };
  assert.equal(scoreResponse('Soy Francisco y trabajo en backend', caso).pasa, true);
  assert.equal(scoreResponse('Francisco es un desarrollador', caso).pasa, false);
  assert.equal(scoreResponse('Los desarrolladores escriben código', caso).pasa, false);
});

test('la respuesta vacía falla aunque no se exija ningún dato', () => {
  const score = scoreResponse('   ', breve);
  assert.equal(score.pasa, false);
  assert.deepEqual(score.fallos, ['respuesta vacía']);
});

test('buildMessages pone el system prompt primero y la pregunta al final', () => {
  const caso = {
    ...breve,
    historial: [
      { role: 'user', content: 'Hola' },
      { role: 'assistant', content: '¡Hola!' },
    ],
  };
  const messages = buildMessages('SYSTEM', caso);
  assert.deepEqual(
    messages.map((message) => message.role),
    ['system', 'user', 'assistant', 'user']
  );
  assert.equal(messages[0].content, 'SYSTEM');
  assert.equal(messages.at(-1).content, caso.pregunta);
});

test('los casos del set están bien formados', () => {
  assert.ok(EVAL_CASES.length >= 20, `se esperaban 20 casos o más, hay ${EVAL_CASES.length}`);

  const ids = new Set();
  for (const caso of EVAL_CASES) {
    assert.ok(!ids.has(caso.id), `id duplicado: ${caso.id}`);
    ids.add(caso.id);
    assert.ok(caso.pregunta.trim().length > 0, `${caso.id} sin pregunta`);
    assert.ok(
      ['perfil', 'honestidad', 'charla', 'off-topic', 'inyección', 'estilo', 'contexto'].includes(
        caso.categoria
      ),
      `${caso.id} categoría desconocida`
    );
    assert.ok(
      caso.maxPalabras === undefined || caso.maxPalabras > 0,
      `${caso.id} maxPalabras inválido`
    );

    for (const pattern of [...(caso.debeIncluir ?? []), ...(caso.noDebeIncluir ?? [])]) {
      assert.ok(pattern instanceof RegExp, `${caso.id} tiene algo que no es RegExp`);
    }

    // Un caso sin ninguna aserción no puntúa nada: mejor que reviente aquí.
    const tieneAlgo =
      (caso.debeIncluir?.length ?? 0) > 0 ||
      (caso.noDebeIncluir?.length ?? 0) > 0 ||
      caso.maxPalabras !== undefined ||
      caso.primeraPersona === true;
    assert.ok(tieneAlgo, `${caso.id} no comprueba nada`);
  }
});
