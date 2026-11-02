export interface SseEvent {
  event: string;
  data: string;
}

/** Serializes one SSE frame. JSON keeps multi-line payloads on a single data line. */
export function formatSseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

interface SseParser {
  push(text: string): SseEvent[];
  end(): SseEvent[];
}

function parseBlock(block: string): SseEvent | null {
  let event = 'message';
  const dataLines: string[] = [];

  for (const line of block.split(/\r?\n/)) {
    if (!line || line.startsWith(':')) continue;

    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);

    if (field === 'event') event = value || 'message';
    else if (field === 'data') dataLines.push(value);
  }

  if (dataLines.length === 0 && event === 'message') return null;
  return { event, data: dataLines.join('\n') };
}

/**
 * Incremental, spec-tolerant SSE reader: frames may arrive split across
 * network chunks and use LF or CRLF separators.
 */
export function createSseParser(): SseParser {
  let buffer = '';

  const drain = (final: boolean): SseEvent[] => {
    const events: SseEvent[] = [];

    for (;;) {
      const lfIndex = buffer.indexOf('\n\n');
      const crlfIndex = buffer.indexOf('\r\n\r\n');
      let endIndex = -1;
      let separatorLength = 0;

      if (lfIndex !== -1 && (crlfIndex === -1 || lfIndex < crlfIndex)) {
        endIndex = lfIndex;
        separatorLength = 2;
      } else if (crlfIndex !== -1) {
        endIndex = crlfIndex;
        separatorLength = 4;
      }

      if (endIndex === -1) break;

      const parsed = parseBlock(buffer.slice(0, endIndex));
      buffer = buffer.slice(endIndex + separatorLength);
      if (parsed) events.push(parsed);
    }

    if (final && buffer.trim()) {
      const parsed = parseBlock(buffer);
      buffer = '';
      if (parsed) events.push(parsed);
    }

    return events;
  };

  return {
    push(text) {
      buffer += text;
      return drain(false);
    },
    end() {
      return drain(true);
    },
  };
}
