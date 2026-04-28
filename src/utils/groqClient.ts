import Groq from 'groq-sdk';

/**
 * Returns an initialized Groq SDK client.
 * If no GROQ_API_KEY is configured and the app runs in development,
 * returns a lightweight mock client so the UI can function without
 * real API keys. Never use the mock in production.
 */
export function getGroqClient(): Groq {
  const apiKey = import.meta.env.GROQ_API_KEY;

  if (apiKey) {
    return new Groq({ apiKey });
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
        create: async function* (_opts: any) {
          const simulated = 'Respuesta de desarrollo (mock) — habilita GROQ_API_KEY para producción.';
          // Yield a single chunk structured like the real SDK stream
          yield { choices: [{ delta: { content: simulated } }] };
        }
      }
    }
  };

  return mockClient as Groq;
}
