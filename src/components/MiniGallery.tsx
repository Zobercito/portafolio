import { useState, useEffect } from 'react';
import type { ModalItemData } from './ModalOverlay';

interface MiniGalleryProps {
  title: string;
  items: (ModalItemData | string)[];
  gradientClass: string;
  onViewAll: () => void;
  onItemClick: (item: ModalItemData) => void;
  isParentModalOpen: boolean;
}

export default function MiniGallery({ title, items, gradientClass, onViewAll, onItemClick, isParentModalOpen }: MiniGalleryProps) {
  const [scrollStep, setScrollStep] = useState(0);

  // Reset scroll position when the modal is closed
  useEffect(() => {
    if (!isParentModalOpen) {
      setScrollStep(0);
    }
  }, [isParentModalOpen]);

  const maxSteps = Math.ceil(items.slice(0, 7).length / 2) - 1;

  const handleArrowClick = () => {
    if (scrollStep < (maxSteps > 0 ? maxSteps : 1)) {
      setScrollStep(prev => prev + 1);
    } else {
      onViewAll();
    }
  };

  return (
    <article className="group shrink-0 relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/35 p-3 sm:p-4 xl:p-6 backdrop-blur-sm xl:col-span-6 xl:row-span-1 flex flex-col h-full">
      <div className={`pointer-events-none absolute inset-0 ${gradientClass}`} />
      
      <div className="relative z-10 flex items-center justify-between shrink-0">
        <h3 className="text-sm sm:text-base xl:text-xl font-semibold tracking-wide text-zinc-100">{title}</h3>
        <button
          type="button"
          onClick={onViewAll}
          className="rounded-full border border-zinc-700 px-2.5 py-0.5 xl:px-3 xl:py-1 text-[9px] xl:text-xs uppercase tracking-[0.18em] text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
        >
          Ver mas
        </button>
      </div>

      <div className="relative z-10 mt-3 xl:mt-4 w-full h-22 sm:h-26 md:h-28 xl:flex-1 xl:min-h-0">
        <button
          type="button"
          onClick={handleArrowClick}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 h-full w-8 sm:w-10 xl:w-14 bg-linear-to-l from-zinc-950/90 via-zinc-950/60 to-transparent flex items-center justify-end pr-0 sm:pr-1 opacity-50 transition-all hover:opacity-100 text-zinc-300 rounded-e-xl cursor-pointer hover:scale-105 active:scale-95"
          aria-label={`Avanzar ${title.toLowerCase()}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 xl:w-6 xl:h-6 transition-transform duration-300 ${scrollStep === 1 ? 'scale-110 text-white' : ''}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        <div className="w-full h-full overflow-hidden mask-[linear-gradient(to_right,black_85%,transparent)]">
          <div
            className="flex w-full h-full gap-3 xl:gap-4 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{ transform: `translateX(-${scrollStep * 45}%)` }}
          >
            {items.slice(0, 7).map((item, index) => {
              const isObj = typeof item === 'object' && item !== null;
              const imageUrl = isObj ? (item as ModalItemData).image : null;
              const itemTitle = isObj ? (item as ModalItemData).title : '';

              return (
                <div
                  key={`gallery-${index}`}
                  onClick={() => imageUrl ? onItemClick(item as ModalItemData) : onViewAll()}
                  className={`group/mini relative shrink-0 h-full aspect-video rounded-xl xl:rounded-2xl border border-zinc-700/50 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-zinc-500/80 cursor-pointer ${imageUrl ? 'bg-zinc-950 p-0' : 'bg-zinc-900/40 p-3 hover:bg-zinc-800/40'}`}
                >
                  {imageUrl ? (
                    <>
                      <img 
                        src={imageUrl} 
                        alt={itemTitle} 
                        loading="lazy" 
                        decoding="async" 
                        className="w-full h-full object-cover opacity-80 group-hover/mini:opacity-100 group-hover/mini:scale-110 transition-all duration-500 [image-rendering:high-quality] will-change-transform" 
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-zinc-950/80 to-transparent opacity-30 group-hover/mini:opacity-10 transition-opacity" />
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 xl:w-12 xl:h-12 rounded-lg bg-zinc-800/80 mb-2 xl:mb-3"></div>
                      <div className="w-3/4 h-2 xl:h-2.5 rounded-full bg-zinc-700/60 mb-1.5 xl:mb-2"></div>
                      <div className="w-1/2 h-1.5 xl:h-2 rounded-full bg-zinc-700/40"></div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </article>
  );
}
