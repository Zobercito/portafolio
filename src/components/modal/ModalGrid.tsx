import type { ModalItemData } from '../ModalOverlay';

interface ModalGridProps {
  title: string;
  items: (ModalItemData | string)[];
  onSelect: (item: ModalItemData) => void;
}

export function ModalGrid({ title, items, onSelect }: ModalGridProps) {
  return (
    <div className="relative z-10 flex-1 overflow-y-auto pr-2 custom-scrollbar">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 xl:gap-6 pt-3 pb-6">
        {items.map((item, index) => {
          const isObj = item && typeof item === 'object';
          const imageUrl = isObj ? (item as ModalItemData).image : null;
          const itemTitle = isObj ? (item as ModalItemData).title : '';

          return (
            <div
              key={`${title}-${index}`}
              onClick={() => isObj && imageUrl ? onSelect(item as ModalItemData) : undefined}
              className={`group relative flex flex-col h-56 sm:h-64 items-center justify-center overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-950/40 transition-all duration-300 hover:border-zinc-500/80 hover:bg-zinc-800/40 hover:-translate-y-1.5 hover:shadow-2xl ${
                isObj && imageUrl ? 'cursor-pointer p-0' : 'p-6'
              }`}
            >
              {imageUrl ? (
                <>
                  <img src={imageUrl} alt={itemTitle} draggable={false} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex flex-col items-center text-center translate-y-3 group-hover:translate-y-0 transition-transform duration-300 ease-out">
                    <span className="text-zinc-100 font-semibold text-sm sm:text-base drop-shadow-md">{itemTitle}</span>
                    <span className="text-[9px] sm:text-[10px] text-zinc-400 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 uppercase tracking-widest font-medium">Click para ampliar</span>
                  </div>
                </>
              ) : item && !isObj ? (
                <div className="text-zinc-300 relative z-10">{item as string}</div>
              ) : (
                <>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-700/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="mb-4 h-14 w-14 xl:h-16 xl:w-16 rounded-2xl bg-zinc-800/80 shadow-inner group-hover:bg-zinc-700/80 transition-colors duration-300"></div>
                  <div className="mb-3 h-3.5 w-[65%] rounded-full bg-zinc-800/80 group-hover:bg-zinc-700/80 transition-colors duration-300"></div>
                  <div className="h-2 w-[40%] rounded-full bg-zinc-800/60 group-hover:bg-zinc-700/60 transition-colors duration-300"></div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
