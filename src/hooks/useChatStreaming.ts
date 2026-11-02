import { useRef, useState } from 'react';
import type { Message } from '../types/chat';
import type { ChatErrorBody, TitleResponse } from '../types/api';
import { createId } from '../utils/id';
import { createSseParser, type SseEvent } from '../utils/sse';
import {
  clearChatSession,
  ensureChatSession,
  getStoredChatSession,
} from '../utils/chatSessionClient';

interface UseChatStreamingProps {
  selectedModel: string;
  onMessagesUpdate: (chatId: string, msgs: Message[]) => void;
  onTitleGenerated: (chatId: string, title: string) => void;
  isChatActive: (chatId: string) => boolean;
}

class ChatRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatRequestError';
  }
}

async function readRequestError(response: Response): Promise<ChatRequestError> {
  if (response.status === 401) {
    clearChatSession();
    return new ChatRequestError(
      'La verificación de seguridad falló. Recarga la página e intenta de nuevo.',
    );
  }
  if (response.status === 429) {
    return new ChatRequestError(
      'Demasiadas solicitudes. Espera un momento y vuelve a intentarlo.',
    );
  }
  if (response.status === 413) {
    return new ChatRequestError('La conversación es demasiado larga. Inicia un chat nuevo.');
  }

  try {
    const data = (await response.json()) as ChatErrorBody;
    if (typeof data?.error === 'string' && data.error) {
      return new ChatRequestError(data.error);
    }
  } catch {
    // Non-JSON error response.
  }

  return new ChatRequestError('No se pudo procesar la solicitud. Intenta de nuevo.');
}

async function sessionHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const sessionId = getStoredChatSession() ?? (await ensureChatSession());
  if (sessionId) headers['x-chat-session'] = sessionId;
  return headers;
}

export function useChatStreaming({
  selectedModel,
  onMessagesUpdate,
  onTitleGenerated,
  isChatActive,
}: UseChatStreamingProps) {
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const abort = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsTyping(false);
  };

  const generateSmartTitle = async (
    chatId: string,
    userMessage: string,
    assistantMessage: string,
  ) => {
    setIsGeneratingTitle(true);
    try {
      const res = await fetch('/api/title', {
        method: 'POST',
        headers: await sessionHeaders(),
        body: JSON.stringify({ userMessage, assistantMessage }),
      });
      if (res.ok) {
        const data = (await res.json()) as TitleResponse;
        if (data?.title) onTitleGenerated(chatId, data.title);
      }
    } catch {
      // Title generation is non-critical and fails silently.
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const fetchAIResponse = async (
    chatId: string,
    currentHistory: Message[],
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  ) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const responseId = createId();
    let finalContent = '';
    let localMessages = [...currentHistory];

    const publish = () => {
      onMessagesUpdate(chatId, localMessages);
      if (isChatActive(chatId)) setMessages(localMessages);
    };

    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: await sessionHeaders(),
        body: JSON.stringify({
          messages: currentHistory.map(({ role, content }) => ({ role, content })),
          modelId: selectedModel,
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw await readRequestError(res);
      if (!res.body) throw new ChatRequestError('No se pudo leer la respuesta del servidor');

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      const parser = createSseParser();
      let isFirstChunk = true;
      let receivedDone = false;
      let streamError: string | null = null;

      const handleEvent = (event: SseEvent): boolean => {
        if (event.event === 'delta') {
          let text = event.data;
          try {
            const parsed = JSON.parse(event.data) as { text?: string };
            if (typeof parsed.text === 'string') text = parsed.text;
          } catch {
            // Tolerate non-JSON payloads by keeping the raw data.
          }
          if (!text) return true;

          finalContent += text;
          if (isFirstChunk) {
            isFirstChunk = false;
            setIsTyping(false);
            localMessages = [
              ...localMessages,
              { id: responseId, role: 'assistant', content: finalContent, isStreaming: true },
            ];
          } else {
            localMessages = localMessages.map((message) =>
              message.id === responseId ? { ...message, content: finalContent } : message,
            );
          }
          publish();
          return true;
        }

        if (event.event === 'error') {
          let message = 'La generación se interrumpió. Puedes reintentar.';
          try {
            const parsed = JSON.parse(event.data) as { message?: string };
            if (parsed?.message) message = parsed.message;
          } catch {
            // Keep the default wording.
          }
          streamError = message;
          return false;
        }

        if (event.event === 'done') {
          receivedDone = true;
          return false;
        }

        return true;
      };

      let reading = true;
      while (reading) {
        const { done, value } = await reader.read();
        if (controller.signal.aborted) {
          await reader.cancel().catch(() => {});
          break;
        }
        if (done) break;

        for (const event of parser.push(decoder.decode(value, { stream: true }))) {
          if (!handleEvent(event)) {
            reading = false;
            break;
          }
        }
      }

      if (reading && !controller.signal.aborted && !streamError) {
        for (const event of parser.end()) {
          if (!handleEvent(event)) break;
        }
      }

      if (controller.signal.aborted) {
        if (finalContent) {
          localMessages = [
            ...currentHistory,
            { id: responseId, role: 'assistant', content: finalContent, isStreaming: false },
          ];
        } else {
          localMessages = [...currentHistory];
        }
        onMessagesUpdate(chatId, localMessages);
        return;
      }

      const failure = streamError
        ?? (!receivedDone
          ? 'La conexión se cortó mientras se generaba la respuesta.'
          : (!finalContent ? 'No pude generar una respuesta. Intenta de nuevo.' : null));

      if (failure) {
        const content = finalContent ? `${finalContent}\n\n${failure}` : failure;
        if (isFirstChunk) {
          localMessages = [
            ...localMessages,
            { id: responseId, role: 'assistant', content, isStreaming: false, isError: true },
          ];
        } else {
          localMessages = localMessages.map((message) =>
            message.id === responseId
              ? { ...message, content, isStreaming: false, isError: true }
              : message,
          );
        }
        publish();
        return;
      }

      localMessages = localMessages.map((message) =>
        message.id === responseId ? { ...message, isStreaming: false } : message,
      );
      publish();

      if (currentHistory.length === 1) {
        void generateSmartTitle(chatId, currentHistory[0].content, finalContent);
      }
    } catch (error) {
      if (controller.signal.aborted) {
        if (finalContent) {
          localMessages = [
            ...currentHistory,
            { id: responseId, role: 'assistant', content: finalContent, isStreaming: false },
          ];
        } else {
          localMessages = [...currentHistory];
        }
        onMessagesUpdate(chatId, localMessages);
        return;
      }

      const message =
        error instanceof ChatRequestError
          ? error.message
          : 'No pude responder ahora mismo. Intenta de nuevo en unos segundos.';

      localMessages = [
        ...currentHistory,
        {
          id: responseId,
          role: 'assistant',
          content: message,
          isStreaming: false,
          isError: true,
        },
      ];
      publish();
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setIsTyping(false);
    }
  };

  return { isTyping, isGeneratingTitle, fetchAIResponse, abort };
}
