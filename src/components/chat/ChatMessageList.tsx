import { ChatMessage } from './ChatMessage';
import type { Message } from '../../types/chat';

interface ChatMessageListProps {
  messages: Message[];
  isTyping: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onRegenerate: () => void;
}

export function ChatMessageList({
  messages,
  isTyping,
  scrollRef,
  onRegenerate,
}: ChatMessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-1 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-700/50 [&::-webkit-scrollbar-thumb]:rounded-full [scrollbar-width:thin] [scrollbar-color:#3f3f46_transparent]">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center px-4 animate-fade-in">
          <h3 className="text-xl md:text-2xl font-medium text-zinc-100 mb-2 tracking-tight">
            ¿En qué puedo ayudarte?
          </h3>
          <p className="text-zinc-400 text-xs md:text-sm max-w-sm [@media(max-height:720px)]:hidden">
            Consulta detalles sobre mi formación como Fullstack Developer o mis proyectos.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {messages.map((msg, idx) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isLast={idx === messages.length - 1}
              onRegenerate={onRegenerate}
            />
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex w-full gap-3 justify-start animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-zinc-800/80 border border-zinc-700/50 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                AI
              </div>
              <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-2xl rounded-bl-sm px-4 py-4 w-fit">
                <div className="flex space-x-1.5 items-center h-2">
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}

          {/* Scroll sentinel — useChatScroll targets this element */}
          <div ref={scrollRef} className="h-1 w-full" />
        </div>
      )}
    </div>
  );
}
