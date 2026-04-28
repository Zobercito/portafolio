import type { APIRoute } from 'astro';
import { getGroqClient } from '../../utils/groqClient';
import { PORTFOLIO_SYSTEM_PROMPT } from '../../data/chatbot-context';
import { CHAT_MODELS, DEFAULT_MODEL } from '../../data/chatModels';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Access Cloudflare environment variables from locals.runtime.env
    // This is necessary because secrets are not available in import.meta.env on Cloudflare Workers
    const runtime = locals.runtime as any;
    const env = runtime?.env || {};
    const groq = getGroqClient(env.GROQ_API_KEY);

    const body = await request.json();
    const { messages, modelId } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Map UI model IDs to Groq specific model IDs
    const modelConfig = CHAT_MODELS.find(m => m.id === modelId) || DEFAULT_MODEL;
    const groqModel = modelConfig.groqId;

    // Format messages for Groq API
    const groqMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content
    }));

    // Inject system prompt at the beginning
    groqMessages.unshift({
      role: 'system',
      content: PORTFOLIO_SYSTEM_PROMPT
    });

    const completion = await groq.chat.completions.create({
      messages: groqMessages,
      model: groqModel,
      temperature: 0.7,
      max_tokens: 500,
      stream: true,
    });

    // Create a readable stream for Server-Sent Events / Streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(new TextEncoder().encode(content));
            }
          }
          controller.close();
        } catch (error) {
          console.error("Stream generation error:", error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      }
    });

  } catch (error: any) {
    console.error('Groq API Endpoint Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
