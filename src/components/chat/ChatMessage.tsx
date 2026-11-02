import { lazy, Suspense, useState } from 'react';
import type { Message } from '../../types/chat';
import { ChatIcons } from './ChatIcons';

const ChatMarkdownBody = lazy(() => import('./ChatMarkdownBody'));

interface ChatMessageProps {
  message: Message;
  isLast: boolean;
  onRegenerate?: () => void;
  onRetry?: () => void;
}

interface MessageUtilitiesProps {
  content: string;
  isLast: boolean;
  isError?: boolean;
  onRegenerate?: () => void;
  onRetry?: () => void;
}

const MessageUtilities = ({
  content,
  isLast,
  isError,
  onRegenerate,
  onRetry,
}: MessageUtilitiesProps) => {
  const [copied, setCopied] = useState(false);
  const [thumb, setThumb] = useState<'up' | 'down' | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { }
  };

  return (
    <div className="flex items-center gap-1.5 mt-2 ml-1 text-zinc-500">
      <button
        onClick={() => setThumb(thumb === 'up' ? null : 'up')}
        className={`p-1.5 rounded-md transition-all ${thumb === 'up' ? 'text-blue-400 bg-zinc-700/30' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/30'}`}
        aria-label="Buena respuesta"
      >
        {thumb === 'up' ? <ChatIcons.ThumbUpFilled /> : <ChatIcons.ThumbUpOutline />}
      </button>

      <button
        onClick={() => setThumb(thumb === 'down' ? null : 'down')}
        className={`p-1.5 rounded-md transition-all ${thumb === 'down' ? 'text-red-400 bg-zinc-700/30' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/30'}`}
        aria-label="Mala respuesta"
      >
        {thumb === 'down' ? <ChatIcons.ThumbDownFilled /> : <ChatIcons.ThumbDownOutline />}
      </button>

      <div className="h-4 w-px bg-zinc-700/50 mx-1"></div>

      {isLast && isError && onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-red-300 hover:text-red-200 hover:bg-red-500/10 rounded-md transition-all"
          aria-label="Reintentar respuesta"
        >
          <ChatIcons.Refresh className="w-3.5 h-3.5" />
          Reintentar
        </button>
      )}

      {isLast && !isError && onRegenerate && (
        <button onClick={onRegenerate} className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/30 rounded-md transition-all" aria-label="Regenerar respuesta">
          <ChatIcons.Refresh />
        </button>
      )}

      <button onClick={handleCopy} className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/30 rounded-md transition-all relative" aria-label="Copiar mensaje">
        <ChatIcons.Copy />
        {copied && <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-800 text-xs px-2 py-1 rounded text-zinc-300 pointer-events-none">Copiado</span>}
      </button>
    </div>
  );
};

export function ChatMessage({ message, isLast, onRegenerate, onRetry }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';
  const isError = Boolean(message.isError);

  return (
    <div className={`flex w-full gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      {isAssistant && (
        <div className="w-8 h-8 rounded-full bg-zinc-800/80 border border-zinc-700/50 flex-shrink-0 flex items-center justify-center overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-[10px] font-bold text-zinc-400">AI</div>
        </div>
      )}

      <div className={`max-w-[90%] md:max-w-[85%] flex flex-col min-w-0 ${isAssistant ? 'items-start' : 'items-end'}`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 leading-relaxed inline-block max-w-full min-w-0 text-[13px] md:text-sm ${isAssistant
            ? isError
              ? 'bg-red-950/40 text-red-200 border border-red-900/60 rounded-bl-sm font-sans'
              : 'bg-zinc-800/60 text-zinc-200 border border-zinc-700/50 rounded-bl-sm font-sans'
            : 'bg-zinc-100 text-zinc-900 rounded-br-sm shadow-md'
          }`}
        >
          {isAssistant ? (
            <div className="w-full break-words min-w-0 prose-sm prose-invert max-w-full overflow-hidden">
              <Suspense fallback={<span className="whitespace-pre-wrap">{message.content}</span>}>
                <ChatMarkdownBody content={message.content} />
              </Suspense>
              {message.isStreaming && <span className="inline-block w-1.5 h-3 ml-1 bg-zinc-400 animate-pulse align-middle"></span>}
            </div>
          ) : (
            <span className="break-words">{message.content}</span>
          )}
        </div>

        {isAssistant && !message.isStreaming && (
          <MessageUtilities
            content={message.content}
            isLast={isLast}
            isError={isError}
            onRegenerate={onRegenerate}
            onRetry={onRetry}
          />
        )}
      </div>

      {!isAssistant && (
        <div className="w-8 h-8 rounded-full bg-zinc-700/50 border border-zinc-600/50 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-zinc-400 uppercase">YO</div>
      )}
    </div>
  );
}
