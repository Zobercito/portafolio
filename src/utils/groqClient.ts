import Groq from 'groq-sdk';

/**
 * Returns an initialized Groq SDK client.
 * If no GROQ_API_KEY is configured and the app runs in development,
 * returns a lightweight mock client so the UI can function without
 * real API keys. Never use the mock in production.
 *
 * Workers note: `groq-sdk` pulls Node builtins (tty/util/path) that do not
 * exist in the edge runtime. `astro.config.mjs` aliases them to `src/empty.js`
 * and `nodejs_compat` is enabled; keep both if the SDK is upgraded.
 */
export function getGroqClient(apiKeyOverride?: string): Groq {
  const apiKey = apiKeyOverride || import.meta.env.GROQ_API_KEY;

  if (apiKey) {
    return new Groq({ apiKey, dangerouslyAllowBrowser: false });
  }

  const isDev = Boolean(import.meta.env && import.meta.env.DEV);

  if (!isDev) {
    throw new Error('GROQ_API_KEY is not configured in the environment variables.');
  }

  // Development mock: provides a `chat.completions.create` async iterable
  // that yields simple simulated chunks. This keeps the frontend working
  // during local development without real credentials.
  console.warn('GROQ_API_KEY not found — using development mock Groq client.');

  const mockClient: any = {
    chat: {
      completions: {
        // Mirrors the two shapes the API routes consume: an async iterable
        // when `stream: true` and a plain completion otherwise.
        create: (opts: { stream?: boolean }, _options?: { signal?: AbortSignal }) => {
          if (opts?.stream) {
            return (async function* () {
              const parts = [
                'Respuesta de desarrollo ',
                '(mock) — habilita ',
                'GROQ_API_KEY para producción.',
              ];
              for (const part of parts) {
                await new Promise((resolve) => setTimeout(resolve, 80));
                yield { choices: [{ delta: { content: part } }] };
              }
            })();
          }

          return Promise.resolve({
            choices: [{ message: { content: 'Conversación de desarrollo' } }],
          });
        }
      }
    }
  };

  return mockClient as Groq;
}
