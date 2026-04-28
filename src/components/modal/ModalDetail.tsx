import type { ModalItemData } from '../ModalOverlay';

interface ModalDetailProps {
  item: ModalItemData;
  showNavigation: boolean;
  onPrev: (e: React.MouseEvent) => void;
  onNext: (e: React.MouseEvent) => void;
  onBack: () => void;
  detailRef: React.RefObject<HTMLDivElement | null>;
  category?: string;
}

export function ModalDetail({ item, showNavigation, onPrev, onNext, onBack, detailRef, category }: ModalDetailProps) {
  return (
    <div
      ref={detailRef}
      className={`absolute w-[95vw] xl:w-full max-w-7xl h-[calc(100svh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-4.5rem)] sm:h-[calc(100svh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-5rem)] xl:h-[85vh] flex flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-[0_0_80px_rgba(0,0,0,0.9)] transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        item ? 'scale-100 opacity-100 pointer-events-auto z-10' : 'scale-[1.1] opacity-0 pointer-events-none z-[-1]'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header bar */}
      <div className={`w-full flex items-center p-4 xl:p-5 border-b border-zinc-800/80 bg-zinc-950 shrink-0 ${item.url ? 'justify-between' : 'justify-end'}`}>
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-zinc-700/80 bg-zinc-900 px-4 py-2 text-xs xl:text-sm uppercase tracking-widest text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-500 transition-all shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
            <span>{category === 'Proyectos' ? 'Ver en GitHub' : 'Ver Certificado'}</span>
          </a>
        )}

        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-full border border-zinc-700/80 bg-zinc-900 px-4 py-2 text-xs xl:text-sm uppercase tracking-widest text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-500 transition-all shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span>Regresar</span>
        </button>
      </div>

      {/* Content body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-950">
        {item.image && (
          <div className="relative w-full bg-zinc-900 border-b border-zinc-800/80">
            <img src={item.image} alt={item.title} className="w-full h-auto max-h-[45vh] xl:max-h-[50vh] object-contain mx-auto" />

            {showNavigation && (
              <>
                <button
                  type="button"
                  onClick={onPrev}
                  className="absolute left-0 inset-y-0 z-20 w-14 sm:w-16 xl:w-24 bg-gradient-to-r from-zinc-950/90 to-transparent flex items-center justify-start pl-2 sm:pl-3 opacity-70 hover:opacity-100 transition-opacity text-zinc-300 rounded-r-xl"
                  aria-label="Anterior"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 xl:w-8 xl:h-8 drop-shadow-md">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className="absolute right-0 inset-y-0 z-20 w-14 sm:w-16 xl:w-24 bg-gradient-to-l from-zinc-950/90 to-transparent flex items-center justify-end pr-2 sm:pr-3 opacity-70 hover:opacity-100 transition-opacity text-zinc-300 rounded-l-xl"
                  aria-label="Siguiente"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 xl:w-8 xl:h-8 drop-shadow-md">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </>
            )}
          </div>
        )}

        <div className="pt-4 sm:pt-5 pb-6 sm:pb-8 px-6 sm:px-10 xl:px-16 text-center w-full mx-auto">
          <h4 className="text-xl sm:text-2xl xl:text-3xl font-semibold text-zinc-100 tracking-wide">{item.title}</h4>
          {item.description && (
            <p className="mt-2 text-sm xl:text-base text-zinc-400 leading-relaxed font-light">{item.description}</p>
          )}
          {item.skills && item.skills.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-800/60">
              <h5 className="text-xs sm:text-sm uppercase tracking-widest text-zinc-500 font-medium mb-2.5">
                {category === 'Proyectos' ? 'Tecnologías utilizadas:' : 'Tecnologías y conocimientos aprendidos:'}
              </h5>
              <div className="flex flex-wrap justify-center gap-2">
                {item.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-[10px] sm:text-xs uppercase tracking-wider font-medium rounded-full bg-zinc-800/60 text-zinc-300 border border-zinc-700/50"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
