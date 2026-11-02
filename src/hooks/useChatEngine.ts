import { useRef, useState } from 'react';
import type { Message } from '../types/chat';
import { CHAT_MODELS } from '../data/chatModels';
import { createId } from '../utils/id';
import { useChatHistory } from './useChatHistory';
import { useChatStreaming } from './useChatStreaming';

/**
 * Orchestrates the chat experience by composing useChatHistory and
 * useChatStreaming. Owns the active messages list and model selection.
 */
export function useChatEngine() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState(CHAT_MODELS[0].id);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const activeChatIdRef = useRef<string | null>(null);

  const {
    history,
    currentChatId,
    setCurrentChatId,
    createChat,
    persistMessages,
    updateChatTitle,
    switchChat: historySwitch,
    deleteHistoryItem: historyDelete,
    renameHistoryItem,
  } = useChatHistory();

  const { isTyping, isGeneratingTitle, fetchAIResponse, abort } = useChatStreaming({
    selectedModel,
    onMessagesUpdate: persistMessages,
    onTitleGenerated: updateChatTitle,
    isChatActive: (chatId) => activeChatIdRef.current === chatId,
  });

  const isBusy = isTyping || messages.some((message) => message.isStreaming);

  const processMessage = (content: string) => {
    const newUserMsg: Message = { id: createId(), role: 'user', content };
    let chatId = currentChatId;

    if (!chatId) {
      chatId = createChat();
    }
    activeChatIdRef.current = chatId;

    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    persistMessages(chatId, updatedMessages);
    fetchAIResponse(chatId, updatedMessages, setMessages);
  };

  const handleNewChat = () => {
    if (messages.length === 0 && !currentChatId) return;
    abort();
    activeChatIdRef.current = null;
    setMessages([]);
    setCurrentChatId(null);
  };

  const switchChat = (chatId: string) => {
    abort();
    activeChatIdRef.current = chatId;
    const chatMessages = historySwitch(chatId);
    setMessages(chatMessages);
  };

  const deleteHistoryItem = (id: string) => {
    const isActive = currentChatId === id;
    if (isActive) abort();

    historyDelete(id);

    if (isActive) {
      activeChatIdRef.current = null;
      setMessages([]);
      setCurrentChatId(null);
    }
  };

  const handleRegenerate = () => {
    if (isBusy || !currentChatId) return;

    const base =
      messages[messages.length - 1]?.role === 'assistant'
        ? messages.slice(0, -1)
        : messages;

    if (base.length === 0) return;

    setMessages(base);
    persistMessages(currentChatId, base);
    fetchAIResponse(currentChatId, base, setMessages);
  };

  const handleRetry = () => {
    if (isBusy || !currentChatId) return;

    const lastMessage = messages[messages.length - 1];
    const base =
      lastMessage?.role === 'assistant' && lastMessage.isError
        ? messages.slice(0, -1)
        : messages;

    if (base.length === 0) return;

    setMessages(base);
    persistMessages(currentChatId, base);
    fetchAIResponse(currentChatId, base, setMessages);
  };

  return {
    messages,
    inputValue,
    setInputValue,
    isTyping,
    isBusy,
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
    handleRetry,
  };
}
