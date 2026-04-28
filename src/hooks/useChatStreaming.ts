import { useState } from 'react';
import type { Message } from '../types/chat';

interface UseChatStreamingProps {
  selectedModel: string;
  onMessagesUpdate: (chatId: string, msgs: Message[]) => void;
  onTitleGenerated: (chatId: string, title: string) => void;
}

export function useChatStreaming({
  selectedModel,
  onMessagesUpdate,
  onTitleGenerated,
}: UseChatStreamingProps) {
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  const generateSmartTitle = async (
    chatId: string,
    userMessage: string,
    assistantMessage: string
  ) => {
    setIsGeneratingTitle(true);
    try {
      const res = await fetch('/api/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage, assistantMessage }),
      });
      if (res.ok) {
        const data = await res.json();
        onTitleGenerated(chatId, data.title);
      }
    } catch {
      // Title generation failed silently — non-critical path
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const fetchAIResponse = async (
    chatId: string,
    currentHistory: Message[],
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  ) => {
    setIsTyping(true);
    const responseId = (Date.now() + 1).toString();
    let finalContent = '';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentHistory.map(({ role, content }) => ({ role, content })),
          modelId: selectedModel,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      if (!res.body) throw new Error('No ReadableStream in response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let isFirstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        finalContent += chunk;

        if (isFirstChunk) {
          setIsTyping(false);
          isFirstChunk = false;
          setMessages((prev) => {
            const next = [...prev, { id: responseId, role: 'assistant' as const, content: finalContent, isStreaming: true }];
            onMessagesUpdate(chatId, next);
            return next;
          });
        } else {
          setMessages((prev) => {
            const next = [...prev];
            const idx = next.findIndex((m) => m.id === responseId);
            if (idx !== -1) next[idx] = { ...next[idx], content: finalContent };
            onMessagesUpdate(chatId, next);
            return next;
          });
        }
      }

      // Mark stream as finished
      setMessages((prev) => {
        const next = [...prev];
        const idx = next.findIndex((m) => m.id === responseId);
        if (idx !== -1) next[idx] = { ...next[idx], isStreaming: false };
        onMessagesUpdate(chatId, next);
        return next;
      });

      // Generate title only on the first message exchange
      if (currentHistory.length === 1) {
        generateSmartTitle(chatId, currentHistory[0].content, finalContent);
      }
    } catch {
      setIsTyping(false);
      const errorContent =
        '❌ Lo siento, no me pude conectar al servidor de Groq. ¿Verificaste que la API key esté configurada?';

      setMessages((prev) => {
        const next = [...prev];
        const idx = next.findIndex((m) => m.id === responseId);
        if (idx !== -1) {
          next[idx] = { ...next[idx], content: errorContent, isStreaming: false };
        } else {
          next.push({ id: responseId, role: 'assistant', content: errorContent, isStreaming: false });
        }
        onMessagesUpdate(chatId, next);
        return next;
      });
    }
  };

  return { isTyping, isGeneratingTitle, fetchAIResponse };
}
