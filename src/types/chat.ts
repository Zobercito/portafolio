export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export interface ChatHistoryEntry {
  id: string;
  title: string;
}
