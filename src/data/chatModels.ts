export interface ChatModel {
  id: string;
  label: string;
  groqId: string;
  description: string;
  temperature: number;
  topP: number;
  reasoningEffort: 'default' | 'low' | 'medium' | 'high';
  maxCompletionTokens: number;
}

// Groq pasó los Llama 3.1/3.3 a su plan Enterprise: con una API key de
// Developer devuelven 404 model_not_found. Estos son los del plan actual.
export const CHAT_MODELS: ChatModel[] = [
  {
    id: 'gpt-oss-120b',
    label: 'GPT OSS 120B',
    groqId: 'openai/gpt-oss-120b',
    description:
      'Modelo abierto de OpenAI con 120B de parámetros. Razona mejor en preguntas complejas.',
    temperature: 1,
    topP: 1,
    reasoningEffort: 'medium',
    maxCompletionTokens: 2048,
  },
  {
    // Preview en Groq: puede retirarse con poco aviso.
    id: 'qwen-27b',
    label: 'Qwen 3.8 27B',
    groqId: 'qwen/qwen3.8-27b',
    description: 'Modelo de Alibaba Cloud con 27B de parámetros. Más ligero y rápido.',
    temperature: 0.6,
    topP: 0.95,
    reasoningEffort: 'default',
    maxCompletionTokens: 2048,
  },
];

export const DEFAULT_MODEL = CHAT_MODELS[0];
