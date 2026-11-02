import type { ChatTurn } from '../utils/chatValidation';

export interface ChatRequest {
  messages: ChatTurn[];
  modelId: string;
}

export interface ChatErrorBody {
  error: string;
  code?: string;
}

export interface TitleRequest {
  userMessage: string;
  assistantMessage?: string;
}

export interface TitleResponse {
  title: string;
}

export interface ContactRequest {
  name: string;
  email: string;
  message: string;
  turnstileToken: string;
}

export interface ContactSuccessResponse {
  success: true;
  sent?: 'server' | 'browser';
  accessKey?: string;
}

export interface ChatSessionRequest {
  turnstileToken: string;
}

export interface ChatSessionResponse {
  sessionId: string;
}

export interface PublicConfigResponse {
  turnstileSitekey: string;
  chatGuardEnabled: boolean;
}
