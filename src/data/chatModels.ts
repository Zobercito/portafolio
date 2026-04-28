export interface ChatModel {
  id: string;
  label: string;
  groqId: string;
  description: string;
}

export const CHAT_MODELS: ChatModel[] = [
  { 
    id: 'llama-8b',
    label: 'Llama 3.1 8B', 
    groqId: 'llama-3.1-8b-instant', 
    description: 'Modelo ligero de Meta. Ideal para consultas rápidas y eficiencia.' 
  },
  { 
    id: 'llama-70b',
    label: 'Llama 3.3 70B', 
    groqId: 'llama-3.3-70b-versatile', 
    description: 'Modelo avanzado de Meta. Excelente equilibrio entre razonamiento y velocidad.' 
  },
  { 
    id: 'gpt-oss',
    label: 'GPT OSS 20B', 
    groqId: 'openai/gpt-oss-20b', 
    description: 'Modelo compacto optimizado. Fuerte en tareas lógicas y generación de código.' 
  }
];

export const DEFAULT_MODEL = CHAT_MODELS[0];
