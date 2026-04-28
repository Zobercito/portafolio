import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { filterValidItems } from '../utils/modalUtils';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { ModalGrid } from './modal/ModalGrid';
import { ModalDetail } from './modal/ModalDetail';

export interface ModalItemData {
  title?: string;
  image?: string;
  description?: string;
  url?: string;
  skills?: string[];
}

interface ModalOverlayProps {
  isOpen: boolean;
  title: string;
  items: (ModalItemData | string)[];
  onClose: () => void;
  initialItem?: ModalItemData | null;
}

export default function ModalOverlay({ isOpen, title, items, onClose, initialItem }: ModalOverlayProps) {
  const { shouldRender, showAnim } = useModalAnimation(isOpen);
  useBodyScrollLock(isOpen);

  const [selectedItem, setSelectedItem] = useState<ModalItemData | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  // Reset or navigate to initial item when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedItem(null);
    } else if (initialItem) {
      setSelectedItem(initialItem);
    }
  }, [isOpen, initialItem]);

  // Global keyboard and outside-click event handlers
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedItem && !initialItem) setSelectedItem(null);
        else onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!document.contains(target)) return;

      // Always close if navbar link is clicked for clean navigation
      const el = target as HTMLElement;
      if (el?.closest?.('a.nav-link')) {
        onClose();
        return;
      }

      if (selectedItem) {
        if (lightboxRef.current && lightboxRef.current.contains(target)) return;
        if (initialItem) onClose();
        else setSelectedItem(null);
        return;
      }

      if (modalRef.current && modalRef.current.contains(target)) return;
      onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose, selectedItem]);

  if (!shouldRender) return null;

  const animOrigin = title === 'Proyectos' ? 'origin-[75%_25%]' : 'origin-[75%_65%]';
  const validItems = filterValidItems(items);
  const currentIndex = selectedItem
    ? validItems.findIndex(i => i.title === selectedItem.title && i.image === selectedItem.image)
    : -1;
  const showNavigation = validItems.length > 1;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItem(currentIndex > 0 ? validItems[currentIndex - 1] : validItems[validItems.length - 1]);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItem(currentIndex < validItems.length - 1 ? validItems[currentIndex + 1] : validItems[0]);
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-40 flex items-start justify-center px-4 pt-[calc(env(safe-area-inset-top)+3.25rem)] sm:pt-[calc(env(safe-area-inset-top)+3.75rem)] xl:items-center xl:pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        showAnim ? 'bg-zinc-950/20' : 'bg-transparent'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onWheel={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      {/* Main grid modal */}
      <div
        ref={modalRef}
        className={`absolute w-[95vw] xl:w-full max-w-5xl h-[calc(100svh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-4.5rem)] sm:h-[calc(100svh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-5rem)] xl:h-[85vh] flex flex-col overflow-hidden rounded-3xl border border-zinc-800/60 bg-zinc-950/50 backdrop-blur-[20px] p-5 sm:p-6 xl:p-8 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          showAnim && !initialItem
            ? 'scale-100 opacity-100 shadow-[0_0_80px_rgba(0,0,0,0.9)] pointer-events-auto'
            : `scale-[0.85] opacity-0 shadow-none pointer-events-none ${animOrigin} z-[-1]`
        }`}
      >
        <div className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${title === 'Proyectos' ? 'bg-[radial-gradient(circle_at_15%_20%,rgba(148,163,184,0.17),transparent_50%)]' : 'bg-[radial-gradient(circle_at_80%_30%,rgba(244,63,94,0.16),transparent_50%)]'} ${showAnim ? 'opacity-100' : 'opacity-0'}`} />

        <div className="relative z-10 mb-6 flex flex-shrink-0 items-center justify-between border-b border-zinc-800/80 pb-5">
          <h3 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-wide">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-xl border border-zinc-700/80 px-4 py-2 text-xs sm:text-sm uppercase tracking-widest text-zinc-300 transition-all hover:border-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/60 shadow-sm">Cerrar</button>
        </div>

        <ModalGrid title={title} items={items} onSelect={setSelectedItem} />
      </div>

      {/* Detail lightbox */}
      {selectedItem && (
        <ModalDetail
          item={selectedItem}
          showNavigation={showNavigation}
          onPrev={handlePrev}
          onNext={handleNext}
          onBack={() => initialItem ? onClose() : setSelectedItem(null)}
          detailRef={lightboxRef}
        />
      )}
    </div>,
    document.body
  );
}
