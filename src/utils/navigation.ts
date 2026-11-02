export const NAVIGATE_EVENT = 'portfolio:navigate';

/**
 * Slides are addressed by their DOM order, which keeps navigation working when
 * a new `[data-section]` is added anywhere in the track. Navbar links are
 * resolved by their `href`, not by their position in the list.
 */
export function navigateToSection(index: number): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<number>(NAVIGATE_EVENT, { detail: index }));
}

export function sectionHash(id: string | undefined, index: number): string {
  if (!id || index === 0) return '/';
  return `#${id}`;
}
