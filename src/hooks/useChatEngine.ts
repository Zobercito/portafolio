import { useState } from 'react';
import type { Message } from '../types/chat';
import { CHAT_MODELS } from '../data/chatModels';
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

  const { isTyping, isGeneratingTitle, fetchAIResponse } = useChatStreaming({
    selectedModel,
    onMessagesUpdate: persistMessages,
    onTitleGenerated: updateChatTitle,
  });

  const processMessage = (content: string) => {
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content };
    let chatId = currentChatId;

    if (!chatId) {
      chatId = createChat();
    }

    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    persistMessages(chatId, updatedMessages);
    fetchAIResponse(chatId, updatedMessages, setMessages);
  };

  const handleNewChat = () => {
    if (messages.length === 0 && !currentChatId) return;
    setMessages([]);
    setCurrentChatId(null);
  };

  const switchChat = (chatId: string) => {
    const chatMessages = historySwitch(chatId);
    setMessages(chatMessages);
  };

  const deleteHistoryItem = (id: string) => {
    historyDelete(id);
    if (currentChatId === id) {
      setMessages([]);
    }
  };

  const handleRegenerate = () => {
    if (isTyping || messages.some((m) => m.isStreaming)) return;
    const updatedMessages = [...messages];
    if (updatedMessages.length > 0 && updatedMessages[updatedMessages.length - 1].role === 'assistant') {
      updatedMessages.pop();
    }
    setMessages(updatedMessages);
    if (currentChatId) {
      persistMessages(currentChatId, updatedMessages);
      fetchAIResponse(currentChatId, updatedMessages, setMessages);
    }
  };

  return {
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
  };
}
