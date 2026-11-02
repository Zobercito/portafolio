import test from 'node:test';
import assert from 'node:assert/strict';

import {
  cspHash,
  cspHashesForHtml,
  extractInlineScripts,
} from '../src/utils/cspHashes.ts';

test('extrae el texto exacto del script inline', async () => {
  const html = '<script>console.log(1);</script>';
  assert.deepEqual(extractInlineScripts(html), [{ code: 'console.log(1);' }]);
  assert.deepEqual(await cspHashesForHtml(html), [
    'sha256-NcFG924SlHfGQGG8hFEeEJDz1NgFlxPmZj3Us1sfdkI=',
  ]);
});

test('los caracteres fuera del alfabeto base64 no rompen el hash', async () => {
  // El navegador hashea los bytes UTF-8; si la codificación base64 estuviera mal
  // estos dos vectores (con `/` y con `+`) no cuadrarían.
  assert.equal(await cspHash('a'), 'sha256-ypeBEsobvcr6wjGzmiPcTaeG7/gUfE5yuYB3ha/uSLs=');
  assert.equal(await cspHash('hello'), 'sha256-LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=');
});

test('ignora los scripts externos y los bloques de datos', () => {
  const html = [
    '<script src="/_astro/chunk.js">/* no se ejecuta */</script>',
    '<script type="application/ld+json">{"@type":"Person"}</script>',
    '<script type="module">init();</script>',
    '<script type="text/javascript">clásico();</script>',
  ].join('\n');

  assert.deepEqual(extractInlineScripts(html).map((s) => s.code), ['init();', 'clásico();']);
});

test('respeta el primer </script> igual que el parser de HTML', () => {
  const html = '<script>const t = "</" + "script>";</script><p>fuera</p>';
  assert.deepEqual(extractInlineScripts(html).map((s) => s.code), [
    'const t = "</" + "script>";',
  ]);
});

test('los atributos del script no se cuelan en el código', () => {
  const html = '<script type="module" data-hidrata="">arranca();</script>';
  assert.deepEqual(extractInlineScripts(html).map((s) => s.code), ['arranca();']);
});

test('no devuelve hash duplicado para el mismo script repetido', async () => {
  const html = '<script>mismo();</script><script>mismo();</script>';
  const hashes = await cspHashesForHtml(html);
  assert.equal(hashes.length, 1);
  assert.match(hashes[0], /^sha256-/);
});

test('un HTML sin scripts inline no aporta hashes', async () => {
  assert.deepEqual(await cspHashesForHtml('<html><body><p>hola</p></body></html>'), []);
});
