import { useState, useRef, useEffect } from 'react';
import { useChatEngine } from '../hooks/useChatEngine';
import { useChatScroll } from '../hooks/useChatScroll';
import { useVisualViewport } from '../hooks/useVisualViewport';
import { ChatIcons } from './chat/ChatIcons';
import { ChatSidebar } from './chat/ChatSidebar';
import { ChatHeader } from './chat/ChatHeader';
import { ChatMessageList } from './chat/ChatMessageList';
import { ChatInput } from './chat/ChatInput';
import type { Message } from '../types/chat';

export default function MiniChat() {
  const {
    messages,
    inputValue,
    setInputValue,
    isTyping,
    currentChatId,
    history,
    selectedModel,
    setSelectedModel,
    isModelMenuOpen,
    setIsModelMenuOpen,
    isGeneratingTitle,
    processMessage,
    handleNewChat,
    switchChat,
    deleteHistoryItem,
    renameHistoryItem,
    handleRegenerate,
  } = useChatEngine();

  const { scrollRef } = useChatScroll([messages, isTyping]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  useVisualViewport(isInputFocused);

  const inputRef = useRef<HTMLInputElement>(null);
  const isFirstRender = useRef(true);
  const isDisabled = isTyping || messages.some((m: Message) => m.isStreaming);

  // Focus back to input when it becomes enabled, but not on initial load
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!isDisabled) {
      inputRef.current?.focus();
    }
  }, [isDisabled]);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isDisabled) return;
    const content = inputValue;
    setInputValue('');
    processMessage(content);
    
    // Initial focus attempt
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSuggestion = (content: string) => {
    processMessage(content);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  return (
    <div data-chat-scroll className="flex h-full w-full bg-transparent font-sans relative overflow-hidden">
      {/* Sidebar toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-[9px] left-[10px] z-50 p-2 rounded-lg transition-all duration-200 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
        aria-label={isSidebarOpen ? 'Cerrar barra lateral' : 'Abrir barra lateral'}
      >
        <ChatIcons.SidebarToggle className="w-[18px] h-[18px]" />
      </button>

      <ChatSidebar
        isOpen={isSidebarOpen}
        history={history}
        currentChatId={currentChatId}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={() => {
          handleNewChat();
          setIsSidebarOpen(false);
        }}
        onSwitchChat={(id: string) => {
          switchChat(id);
          if (window.innerWidth < 1024) setIsSidebarOpen(false);
        }}
        onDeleteChat={deleteHistoryItem}
        onRenameChat={renameHistoryItem}
      />

      {/* Main content area */}
      <div className={`flex flex-col h-full flex-1 min-w-0 bg-transparent relative transition duration-300 ${isSidebarOpen ? 'blur-[3px]' : ''}`}>
        <ChatHeader
          currentChatId={currentChatId}
          history={history}
          isGeneratingTitle={isGeneratingTitle}
          selectedModel={selectedModel}
          isModelMenuOpen={isModelMenuOpen}
          onModelSelect={(id) => { setSelectedModel(id); setIsModelMenuOpen(false); }}
          onModelMenuToggle={() => setIsModelMenuOpen(!isModelMenuOpen)}
        />

        <ChatMessageList
          messages={messages}
          isTyping={isTyping}
          scrollRef={scrollRef}
          onRegenerate={handleRegenerate}
        />

        <ChatInput
          ref={inputRef}
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          onSuggestion={handleSuggestion}
          isDisabled={isDisabled}
          showSuggestions={messages.length === 0}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        />
      </div>
    </div>
  );
}
