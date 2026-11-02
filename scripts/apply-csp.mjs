#!/usr/bin/env node
// Añade a `dist/client/_headers` los hashes CSP de los scripts inline que Astro
// dejó en el HTML prerenderizado. Se ejecuta después de `astro build` (ver el
// script `build` de package.json): sin estos hashes la landing quedaría sin
// hidratar, porque la política ya no permite `'unsafe-inline'` en `script-src`.
//
// Los hashes se calculan sobre el texto exacto que está en el fichero, que es
// lo que hashará el navegador. Si Astro cambia sus cargadores inline o aparece
// un script nuevo, basta con volver a construir.

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { buildContentSecurityPolicy } from '../src/utils/securityHeaders.ts';
import { cspHashesForHtml } from '../src/utils/cspHashes.ts';

const CLIENT_DIR = path.resolve(fileURLToPath(import.meta.url), '../../dist/client');
const CSP_LINE_RE = /^[ \t]*Content-Security-Policy(?:-Report-Only)?:.*$/im;

async function htmlFiles(dir, acc = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '_astro') await htmlFiles(full, acc);
    } else if (entry.name.endsWith('.html')) {
      acc.push(full);
    }
  }
  return acc;
}

async function main() {
  const headersPath = path.join(CLIENT_DIR, '_headers');
  let headers;
  try {
    headers = await readFile(headersPath, 'utf8');
  } catch {
    console.error(`[csp] No encuentro ${headersPath}. ¿Se ejecutó "astro build"?`);
    process.exit(1);
  }

  if (!CSP_LINE_RE.test(headers)) {
    console.error('[csp] `dist/client/_headers` no tiene ninguna línea Content-Security-Policy que reescribir.');
    process.exit(1);
  }

  const pages = await htmlFiles(CLIENT_DIR);
  if (pages.length === 0) {
    console.error('[csp] No hay ningún HTML en dist/client para hashear.');
    process.exit(1);
  }

  const perPage = new Map();
  for (const page of pages) {
    perPage.set(path.relative(CLIENT_DIR, page), await cspHashesForHtml(await readFile(page, 'utf8')));
  }

  // `_headers` no puede condicionar la CSP por contenido de página, así que se
  // autoriza la unión de hashes. Cada página sólo ejecuta los suyos.
  const hashes = [...new Set([...perPage.values()].flat())];
  const policy = buildContentSecurityPolicy(hashes);
  await writeFile(headersPath, headers.replace(CSP_LINE_RE, `  Content-Security-Policy: ${policy}`), 'utf8');

  for (const [page, pageHashes] of perPage) {
    console.log(`[csp] ${page}: ${pageHashes.length} script(s) inline`);
  }
  console.log(`[csp] ${hashes.length} hash(es) escritos en la CSP de dist/client/_headers`);
}

main().catch((error) => {
  console.error('[csp]', error);
  process.exit(1);
});
