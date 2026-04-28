import { CHAT_MODELS } from '../../data/chatModels';
import type { ChatModel } from '../../data/chatModels';
import type { ChatHistoryEntry } from '../../types/chat';
import { ChatIcons } from './ChatIcons';

interface ChatHeaderProps {
  currentChatId: string | null;
  history: ChatHistoryEntry[];
  isGeneratingTitle: boolean;
  selectedModel: string;
  isModelMenuOpen: boolean;
  onModelSelect: (modelId: string) => void;
  onModelMenuToggle: () => void;
}

export function ChatHeader({
  currentChatId,
  history,
  isGeneratingTitle,
  selectedModel,
  isModelMenuOpen,
  onModelSelect,
  onModelMenuToggle,
}: ChatHeaderProps) {
  const currentTitle =
    currentChatId
      ? (history.find((h) => h.id === currentChatId)?.title || 'Conversación')
      : null;

  return (
    <div className="px-3 py-2 border-b border-zinc-800/50 bg-zinc-900/30 w-full flex items-center justify-between shrink-0 h-[52px]">
      {/* Dynamic conversation title */}
      <div className="flex items-center gap-2 flex-1 min-w-0 text-[13px] font-medium text-zinc-400 px-10 truncate">
        {isGeneratingTitle ? (
          <div className="flex flex-col gap-1 w-20 animate-pulse">
            <div className="h-1.5 bg-zinc-800 rounded w-full"></div>
            <div className="h-1.5 bg-zinc-800 rounded w-2/3"></div>
          </div>
        ) : currentTitle}
      </div>

      {/* Model selector dropdown */}
      <div className="relative">
        <button
          onClick={onModelMenuToggle}
          className="flex items-center gap-1.5 hover:bg-zinc-800/80 px-2 py-1.5 rounded-lg transition-colors text-zinc-300 text-[11px] sm:text-[13px] font-medium border border-transparent hover:border-zinc-700/50 select-none shrink-0"
        >
          {CHAT_MODELS.find((m) => m.id === selectedModel)?.label || selectedModel}
          <ChatIcons.ChevronDown
            className={`text-zinc-500 transition-transform duration-200 ${isModelMenuOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isModelMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => onModelSelect(selectedModel)} />
            <div className="absolute top-full right-0 mt-1.5 w-64 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-50 animate-fade-in origin-top-right">
              {CHAT_MODELS.map((model: ChatModel) => (
                <div
                  key={model.id}
                  className="p-2 hover:bg-zinc-800/80 rounded-lg cursor-pointer transition-colors mt-0.5 first:mt-0"
                  onClick={() => onModelSelect(model.id)}
                >
                  <div className="text-sm text-zinc-200 flex items-center justify-between font-medium">
                    {model.label}
                    {selectedModel === model.id && (
                      <ChatIcons.Check className="text-blue-500 w-4 h-4" />
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{model.description}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
