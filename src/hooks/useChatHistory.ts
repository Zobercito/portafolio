import { useState } from 'react';
import type { Message, ChatHistoryEntry } from '../types/chat';

export function useChatHistory() {
  const [history, setHistory] = useState<ChatHistoryEntry[]>([]);
  const [chatMessagesMap, setChatMessagesMap] = useState<Record<string, Message[]>>({});
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Creates a new history entry and returns the new chatId
  const createChat = (): string => {
    const chatId = Date.now().toString();
    setHistory((prev) => [{ id: chatId, title: 'Nueva conversación...' }, ...prev]);
    setCurrentChatId(chatId);
    return chatId;
  };

  // Saves the current messages into the map for the given chatId
  const persistMessages = (chatId: string, msgs: Message[]) => {
    setChatMessagesMap((prev) => ({ ...prev, [chatId]: msgs }));
  };

  // Updates the title of an existing chat
  const updateChatTitle = (chatId: string, title: string) => {
    setHistory((prev) =>
      prev.map((h) => (h.id === chatId ? { ...h, title } : h))
    );
  };

  // Returns the stored messages for the given chat and sets it as current
  const switchChat = (chatId: string): Message[] => {
    setCurrentChatId(chatId);
    return chatMessagesMap[chatId] || [];
  };

  const deleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    setChatMessagesMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    return id; // Return id so caller can clear messages if needed
  };

  const renameHistoryItem = (id: string, newTitle: string) => {
    setHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title: newTitle } : item))
    );
  };

  return {
    history,
    chatMessagesMap,
    currentChatId,
    setCurrentChatId,
    createChat,
    persistMessages,
    updateChatTitle,
    switchChat,
    deleteHistoryItem,
    renameHistoryItem,
  };
}
