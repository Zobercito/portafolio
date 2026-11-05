export interface TextLink {
  text: string;
  url: string;
}

export interface TextSegment {
  text: string;
  url?: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function splitByLinks(text: string, links: TextLink[] = []): TextSegment[] {
  const valid = links.filter((link) => link.text && link.url);
  if (valid.length === 0) return [{ text }];

  const urlByText = new Map(valid.map((link) => [link.text, link.url]));
  const pattern = new RegExp(`(${valid.map((link) => escapeRegExp(link.text)).join('|')})`, 'g');

  return text
    .split(pattern)
    .filter((part) => part !== '')
    .map((part) => {
      const url = urlByText.get(part);
      return url ? { text: part, url } : { text: part };
    });
}
