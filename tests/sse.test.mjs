import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createSseParser,
  formatSseEvent,
} from '../src/utils/sse.ts';

test('formatSseEvent produce un marco SSE válido de una sola línea data', () => {
  const frame = formatSseEvent('delta', { text: 'hola\nmundo' });
  assert.equal(frame, 'event: delta\ndata: {"text":"hola\\nmundo"}\n\n');
});

test('el parser agrupa eventos completos separados por doble salto de línea', () => {
  const parser = createSseParser();
  const events = parser.push(
    'event: delta\ndata: {"text":"una"}\n\nevent: done\ndata: {}\n\n',
  );
  assert.deepEqual(events, [
    { event: 'delta', data: '{"text":"una"}' },
    { event: 'done', data: '{}' },
  ]);
});

test('el parser tolera marcos divididos entre chunks de red', () => {
  const parser = createSseParser();
  assert.deepEqual(parser.push('event: del'), []);
  assert.deepEqual(parser.push('ta\ndata: {"te'), []);
  const events = parser.push('xt":"ok"}\n\n');
  assert.deepEqual(events, [{ event: 'delta', data: '{"text":"ok"}' }]);
});

test('el parser acepta separadores CRLF', () => {
  const parser = createSseParser();
  const events = parser.push('event: delta\r\ndata: {"text":"cr"}\r\n\r\n');
  assert.deepEqual(events, [{ event: 'delta', data: '{"text":"cr"}' }]);
});

test('el parser ignora comentarios y asume el evento por defecto', () => {
  const parser = createSseParser();
  const events = parser.push(': keep-alive\ndata: ping\n\n');
  assert.deepEqual(events, [{ event: 'message', data: 'ping' }]);
});

test('end() recupera un marco final sin separador de cierre', () => {
  const parser = createSseParser();
  assert.deepEqual(parser.push('event: done\ndata: {}'), []);
  assert.deepEqual(parser.end(), [{ event: 'done', data: '{}' }]);
});

test('un parseo de payload inválido no rompe el flujo del consumidor', () => {
  // El cliente hace JSON.parse con fallback al dato crudo; aquí se valida que
  // el parser entrega el texto tal cual para que el consumidor decida.
  const parser = createSseParser();
  const [event] = parser.push('event: delta\ndata: no-es-json\n\n');
  assert.equal(event.data, 'no-es-json');
});
