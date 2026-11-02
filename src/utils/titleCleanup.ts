export const FALLBACK_TITLE = 'Nueva conversación';

const SURROUNDING_QUOTES = /^["'`«»“”]+|["'`«»“”]+$/g;

export function cleanTitle(raw: string | null | undefined): string {
  const cleaned = (raw ?? '')
    .trim()
    .replace(SURROUNDING_QUOTES, '')
    .trim();

  return cleaned || FALLBACK_TITLE;
}
