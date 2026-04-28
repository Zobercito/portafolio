import { useState } from 'react';
import type { ChatHistoryEntry } from '../../types/chat';
import { ChatIcons } from './ChatIcons';

interface ChatSidebarProps {
  isOpen: boolean;
  history: ChatHistoryEntry[];
  currentChatId: string | null;
  onClose: () => void;
  onNewChat: () => void;
  onSwitchChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, title: string) => void;
}

export function ChatSidebar({
  isOpen,
  history,
  currentChatId,
  onClose,
  onNewChat,
  onSwitchChat,
  onDeleteChat,
  onRenameChat,
}: ChatSidebarProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [menuPlacement, setMenuPlacement] = useState<'top' | 'bottom'>('bottom');

  const handleStartRename = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditingTitle(currentTitle);
    setActiveMenuId(null);
  };

  const handleRenameSubmit = (id: string) => {
    if (editingTitle.trim()) {
      onRenameChat(id, editingTitle);
    }
    setEditingId(null);
  };

  return (
    <>
      {isOpen && (
        <div
          className="absolute inset-0 bg-black/40 z-20 animate-fade-in"
          onClick={onClose}
        ></div>
      )}

      <aside
        className={`absolute z-30 h-full bg-zinc-900/95 backdrop-blur-xl border-zinc-800/50 transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${
          isOpen ? 'w-[200px] translate-x-0 border-r' : 'w-[200px] -translate-x-full border-none'
        }`}
      >
        <div className="flex flex-col h-full w-[200px] p-2.5 overflow-hidden">
          <div className="flex items-center gap-2 mb-6 mt-[1px]">
            <div className="w-[34px] shrink-0"></div>
            <button
              onClick={onNewChat}
              className="flex items-center justify-center gap-2 flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 py-[7px] rounded-xl transition-all text-sm font-semibold shadow-lg shadow-black/20 px-2"
            >
              <ChatIcons.Plus className="w-4 h-4 shrink-0" />
              Nuevo chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-2">Recientes</div>
            {history.map((chat) => (
              <div key={chat.id} className="relative group">
                {editingId === chat.id ? (
                  <div className="px-2 py-1.5">
                    <input
                      autoFocus
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => handleRenameSubmit(chat.id)}
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') handleRenameSubmit(chat.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-[13px] text-zinc-100 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-0 w-full rounded-xl hover:bg-zinc-800/80 transition-all px-1">
                    <button
                      onClick={() => onSwitchChat(chat.id)}
                      className={`flex items-center gap-2.5 flex-1 py-2 pl-2 pr-1 transition-all text-[13px] text-left line-clamp-1 truncate ${
                        currentChatId === chat.id ? 'text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-100'
                      }`}
                    >
                      <ChatIcons.MessageDots className="w-4 h-4 shrink-0 opacity-40 group-hover:opacity-100" />
                      <span className="truncate">{chat.title}</span>
                    </button>

                    <div className="relative">
                      <button
                        onClick={(e: React.MouseEvent) => {
                          if (activeMenuId === chat.id) {
                            setActiveMenuId(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const container = e.currentTarget.closest('.overflow-y-auto');
                            let spaceBelow = window.innerHeight - rect.bottom;
                            if (container) {
                              const containerRect = container.getBoundingClientRect();
                              spaceBelow = containerRect.bottom - rect.bottom;
                            }
                            setMenuPlacement(spaceBelow < 90 ? 'top' : 'bottom');
                            setActiveMenuId(chat.id);
                          }
                        }}
                        className={`p-1.5 rounded-lg transition-all text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/50 ${
                          activeMenuId === chat.id ? 'bg-zinc-700/50 text-zinc-200' : ''
                        }`}
                      >
                        <ChatIcons.DotsVertical className="w-3.5 h-3.5" />
                      </button>

                      {activeMenuId === chat.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)}></div>
                          <div
                            className={`absolute right-0 w-32 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1 z-50 animate-fade-in ${
                              menuPlacement === 'top' ? 'bottom-full mb-1 origin-bottom-right' : 'top-full mt-1 origin-top-right'
                            }`}
                          >
                            <button
                              onClick={() => handleStartRename(chat.id, chat.title)}
                              className="flex items-center gap-2 w-full p-2 text-[12px] text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 rounded-lg transition-colors"
                            >
                              <ChatIcons.Edit className="w-3.5 h-3.5" />
                              Renombrar
                            </button>
                            <button
                              onClick={() => onDeleteChat(chat.id)}
                              className="flex items-center gap-2 w-full p-2 text-[12px] text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <ChatIcons.Trash className="w-3.5 h-3.5" />
                              Borrar
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-zinc-800/50 text-[11px] text-zinc-500 px-2 flex items-center justify-between">
            <span>Powered by Groq API 🚀</span>
            <a
              href="https://groq.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-200 transition-colors opacity-60 hover:opacity-100"
              title="Más información sobre Groq"
            >
              <ChatIcons.Info className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
