import type { APIRoute } from 'astro';
import { getGroqClient } from '../../utils/groqClient';

export const prerender = false;

const TITLE_SYSTEM_PROMPT = `Eres un experto redactor. Tu única tarea es leer la interacción entre el usuario y el asistente y generar un título corto y descriptivo para la conversación.
Reglas estrictas:
- El título debe tener entre 3 y 5 palabras máximo.
- NO uses comillas, puntos finales, ni ningún otro signo de puntuación al inicio o final.
- NO des explicaciones, devuelve únicamente el título.
- El título debe describir el tema principal de la consulta.`;

export const POST: APIRoute = async ({ request }) => {
  try {
    const groq = getGroqClient();
    const body = await request.json();
    const { userMessage, assistantMessage } = body;

    if (!userMessage) {
      return new Response(JSON.stringify({ error: 'userMessage is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: TITLE_SYSTEM_PROMPT },
        { role: 'user', content: `Genera un título para esto:\nUsuario: ${userMessage}\nAsistente: ${assistantMessage || ''}` }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 15,
    });

    const title = completion.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, '') || 'Nueva conversación';

    return new Response(JSON.stringify({ title }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('Title Generation Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
