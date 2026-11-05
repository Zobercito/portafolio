export interface EvalTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface EvalMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type EvalCategory =
  'perfil' | 'honestidad' | 'charla' | 'off-topic' | 'inyección' | 'estilo' | 'contexto';

export interface EvalCase {
  id: string;
  categoria: EvalCategory;
  pregunta: string;
  /** Historial previo, para comprobar que se mantiene en personaje. */
  historial?: EvalTurn[];
  /** Se exige al menos una coincidencia (si la lista no está vacía). */
  debeIncluir?: RegExp[];
  /** Cualquier coincidencia hunde el caso: fugas del prompt, respuestas fuera de lugar. */
  noDebeIncluir?: RegExp[];
  maxPalabras?: number;
  /** Obliga a hablar de sí mismo en primera persona y no como tercera. */
  primeraPersona?: boolean;
  nota?: string;
}

export interface EvalScore {
  pasa: boolean;
  palabras: number;
  fallos: string[];
}

const FIRST_PERSON_PATTERN = /\b(yo|me|mi|mí|soy|estoy|he|hice|fue|trabaj|estudi|complet)\b/i;
const THIRD_PERSON_PATTERN =
  /\b(él es|es francisco|francisco (?:es|tiene|estudi|trabaj)|el (?:autor|creador|desarrollador))\b/i;

export function contarPalabras(texto: string): number {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Puntúa una respuesta del chat contra lo que espera el caso. Todo es
 * determinista y sin red: el modelo se llama aparte, así que el criterio se
 * puede probar y revisar sin gastar cuota.
 */
export function scoreResponse(texto: string, caso: EvalCase): EvalScore {
  const palabras = contarPalabras(texto);
  const fallos: string[] = [];

  if (caso.maxPalabras !== undefined && palabras > caso.maxPalabras) {
    fallos.push(`brevedad: ${palabras} palabras (máximo ${caso.maxPalabras})`);
  }

  if (!texto.trim()) {
    fallos.push('respuesta vacía');
  }

  const debe = caso.debeIncluir ?? [];
  if (debe.length > 0 && !debe.some((pattern) => pattern.test(texto))) {
    const resumen = debe.map((pattern) => String(pattern).slice(0, 34)).join(' | ');
    fallos.push(`corrección: falta el dato esperado (${resumen})`);
  }

  for (const pattern of caso.noDebeIncluir ?? []) {
    if (pattern.test(texto)) {
      fallos.push(`${caso.categoria === 'inyección' ? 'fuga' : 'prohibido'}: coincidió ${pattern}`);
    }
  }

  if (caso.primeraPersona) {
    if (!FIRST_PERSON_PATTERN.test(texto)) fallos.push('tono: no habla en primera persona');
    if (THIRD_PERSON_PATTERN.test(texto)) fallos.push('tono: se describe en tercera persona');
  }

  return { pasa: fallos.length === 0, palabras, fallos };
}

/** Componentes del mensaje que manda `/api/chat`, sin la parte de red. */
export function buildMessages(systemPrompt: string, caso: EvalCase): EvalMessage[] {
  const turns: EvalMessage[] = [
    ...(caso.historial ?? []),
    { role: 'user', content: caso.pregunta },
  ];
  return [{ role: 'system', content: systemPrompt }, ...turns];
}
