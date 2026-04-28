import type { ModalItemData } from '../components/ModalOverlay';

/**
 * Filters a mixed items array returning only entries that have an image property,
 * i.e. real populated items as opposed to placeholder empty strings.
 * Used by ModalOverlay to derive the navigation index from a mixed items array.
 */
export function filterValidItems(items: (ModalItemData | string)[]): ModalItemData[] {
  return items.filter(
    (item): item is ModalItemData =>
      typeof item === 'object' && item !== null && !!item.image
  );
}
