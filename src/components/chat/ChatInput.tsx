import { forwardRef } from 'react';
import { ChatIcons } from './ChatIcons';

interface Suggestion {
  label: string;
  text: string;
}

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.SyntheticEvent) => void;
  onSuggestion: (text: string) => void;
  isDisabled: boolean;
  onFocus: () => void;
  onBlur: () => void;
  showSuggestions: boolean;
}

const SUGGESTIONS: Suggestion[] = [
  { label: 'Sobre mí', text: 'Háblame sobre ti' },
  { label: 'Proyectos', text: '¿Qué proyectos has realizado?' },
  { label: 'Skills', text: '¿Cuáles son tus principales skills?' },
];

export const ChatInput = forwardRef<HTMLInputElement, ChatInputProps>(({
  value,
  onChange,
  onSubmit,
  onSuggestion,
  isDisabled,
  onFocus,
  onBlur,
  showSuggestions
}, ref) => {
  return (
    <div className="relative">
      {/* Suggestions Overlay */}
      {showSuggestions && (
        <div className="absolute bottom-full mb-2 w-full pointer-events-none">
          <div className="px-4 pb-2 flex flex-wrap justify-center gap-2 animate-fade-in pointer-events-auto scale-90 md:scale-100">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => onSuggestion(s.text)}
                disabled={isDisabled}
                className="px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 backdrop-blur-md text-zinc-400 text-[10px] md:text-xs hover:border-zinc-600 hover:text-zinc-200 hover:bg-zinc-800 transition-all active:scale-95 shadow-lg disabled:opacity-50"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/50 shrink-0">
        <form onSubmit={onSubmit} className="relative flex items-center">
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="Pregúntame algo..."
            disabled={isDisabled}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-full pl-4 pr-12 py-2.5 text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-300 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!value.trim() || isDisabled}
            className="absolute right-1.5 p-2 bg-zinc-100 text-zinc-900 rounded-full hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
            aria-label="Enviar mensaje"
          >
            <ChatIcons.Send className="w-4.5 h-4.5 transition-transform group-hover:-translate-y-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';
