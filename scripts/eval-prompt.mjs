/**
 * Evaluación del prompt del MiniChat contra Groq real.
 *
 *   npm run eval                         # modelo por defecto, todos los casos
 *   npm run eval -- --all-models         # también el resto del catálogo
 *   npm run eval -- --only receta        # sólo los ids que coincidan
 *   npm run eval -- --json               # además el resultado en JSON
 *
 * Llama a Groq con el mismo system prompt y los mismos parámetros que
 * `/api/chat`, pero sin el flujo SSE y sin sesión de Turnstile: lo que se
 * puntúa es la respuesta, no el transporte. Necesita GROQ_API_KEY en `.env`.
 */
import Groq from 'groq-sdk';

import {
  PORTFOLIO_SYSTEM_PROMPT,
  PORTFOLIO_SYSTEM_PROMPT_VERSION,
} from '../src/data/chatbot-context.ts';
import { CHAT_MODELS, DEFAULT_MODEL } from '../src/data/chatModels.ts';
import { modelCandidates, withModelFallback } from '../src/utils/groqFallback.ts';
import { buildMessages, scoreResponse } from '../src/utils/promptEval.ts';
import { EVAL_CASES } from '../eval/cases.ts';

function parseArgs(argv) {
  const args = {
    allModels: false,
    json: false,
    dryRun: false,
    only: '',
    model: DEFAULT_MODEL.id,
    concurrency: 4,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--all-models') args.allModels = true;
    else if (flag === '--json') args.json = true;
    else if (flag === '--dry-run') args.dryRun = true;
    else if (flag === '--only') args.only = argv[++index] ?? '';
    else if (flag === '--model') args.model = argv[++index] ?? args.model;
    else if (flag === '--concurrency') args.concurrency = Number(argv[++index]) || args.concurrency;
    else {
      console.error(`Flag no reconocido: ${flag}`);
      process.exit(2);
    }
  }
  return args;
}

function loadKey() {
  try {
    process.loadEnvFile();
  } catch {
    // Sin `.env` se intenta con el entorno ya cargado.
  }
  return process.env.GROQ_API_KEY ?? '';
}

const args = parseArgs(process.argv.slice(2));
const apiKey = loadKey();

if (!apiKey && !args.dryRun) {
  console.error('Falta GROQ_API_KEY (en .env o en el entorno). No se gasta ninguna llamada.');
  console.error('Para probar el puntuador sin clave: npm run eval -- --dry-run');
  process.exit(1);
}

const preferred = CHAT_MODELS.find((model) => model.id === args.model);
if (!preferred) {
  console.error(`Modelo desconocido: ${args.model}. Opciones: ${CHAT_MODELS.map((m) => m.id).join(', ')}`);
  process.exit(2);
}

const models = args.allModels ? CHAT_MODELS : [preferred];
const cases = args.only
  ? EVAL_CASES.filter((entry) => entry.id.includes(args.only) || entry.categoria.includes(args.only))
  : EVAL_CASES;

if (cases.length === 0) {
  console.error(`Ningún caso coincide con "${args.only}".`);
  process.exit(2);
}

// Respuesta simulada de --dry-run: hace pasar el puntuador, el pool y el informe
// sin tocar la red, para poder probar el andamiaje sin clave ni cuota.
const DRY_REPLY = 'Soy Francisco, backend con Node.js y Python. ¿Te cuento más de mi práctica?';

const groq = args.dryRun ? null : new Groq({ apiKey, timeout: 60_000, maxRetries: 1 });

async function askOnce(caso, model) {
  const { result, model: used, fellBack } = await withModelFallback(
    modelCandidates(model),
    (candidate) =>
      groq.chat.completions.create({
        messages: buildMessages(PORTFOLIO_SYSTEM_PROMPT, caso),
        model: candidate.groqId,
        temperature: candidate.temperature,
        top_p: candidate.topP,
        reasoning_effort: candidate.reasoningEffort,
        max_completion_tokens: candidate.maxCompletionTokens,
      }),
    (failed, next) => console.warn(`  ! ${failed.groqId} no disponible, se prueba ${next.groqId}`),
  );

  const texto = result.choices[0]?.message?.content ?? '';
  return { texto, usado: used.groqId, fellBack };
}

async function runCase(caso, model) {
  const started = Date.now();
  if (args.dryRun) {
    return {
      id: caso.id,
      categoria: caso.categoria,
      modelo: `${model.groqId} (simulado)`,
      duracionMs: Date.now() - started,
      ...scoreResponse(DRY_REPLY, caso),
      texto: DRY_REPLY,
    };
  }
  try {
    const { texto, usado, fellBack } = await askOnce(caso, model);
    const score = scoreResponse(texto, caso);
    return {
      id: caso.id,
      categoria: caso.categoria,
      modelo: usado,
      reintentado: fellBack,
      duracionMs: Date.now() - started,
      ...score,
      texto,
      fallos: score.fallos,
    };
  } catch (error) {
    return {
      id: caso.id,
      categoria: caso.categoria,
      modelo: model.groqId,
      duracionMs: Date.now() - started,
      pasa: false,
      palabras: 0,
      fallos: [`llamada fallida: ${error instanceof Error ? error.message : String(error)}`],
      texto: '',
    };
  }
}

/** Cola simple: los casos se disparan de `concurrency` en `concurrency`. */
async function runPool(items, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function next() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(args.concurrency, items.length) }, next));
  return results;
}

const filas = [];
for (const model of models) {
  console.log(
    `Prompt ${PORTFOLIO_SYSTEM_PROMPT_VERSION} · ${model.groqId} · ${cases.length} casos · ${new Date().toISOString()}`,
  );
  const resultados = await runPool(cases, (caso) => runCase(caso, model));
  filas.push(...resultados);

  for (const fila of resultados) {
    const marca = fila.pasa ? 'ok  ' : 'FALLA';
    console.log(
      `  ${marca} ${fila.id.padEnd(24)} ${String(fila.palabras).padStart(3)} pal ${Math.round(fila.duracionMs / 100) / 10}s`,
    );
    if (!fila.pasa) {
      for (const fallo of fila.fallos) console.log(`       · ${fallo}`);
      console.log(`       → ${fila.texto.replace(/\s+/g, ' ').slice(0, 220)}`);
    }
  }
}

const porCategoria = new Map();
for (const fila of filas) {
  const bucket = porCategoria.get(fila.categoria) ?? { total: 0, fallan: 0 };
  bucket.total += 1;
  if (!fila.pasa) bucket.fallan += 1;
  porCategoria.set(fila.categoria, bucket);
}

const fallan = filas.filter((fila) => !fila.pasa);
console.log(`\n${filas.length - fallan.length}/${filas.length} casos en verde`);
for (const [categoria, bucket] of porCategoria) {
  console.log(`  ${categoria.padEnd(10)} ${bucket.total - bucket.fallan}/${bucket.total}`);
}

if (args.json) {
  console.log(
    JSON.stringify(
      {
        promptVersion: PORTFOLIO_SYSTEM_PROMPT_VERSION,
        fecha: new Date().toISOString(),
        resultados: filas.map(({ texto, ...resto }) => resto),
      },
      null,
      2,
    ),
  );
}

process.exit(fallan.length === 0 ? 0 : 1);
