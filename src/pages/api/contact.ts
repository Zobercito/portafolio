import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * POST /api/contact
 *
 * Handles contact form submissions:
 * 1. Validates the Cloudflare Turnstile token on the server
 * 2. Forwards the form data to Web3Forms if validation succeeds
 * 3. Returns the result
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = locals.runtime as any;
    const env = runtime?.env || {};
    
    const body = await request.json();
    const { name, email, message, turnstileToken } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!turnstileToken) {
      return new Response(
        JSON.stringify({ error: 'Token de Turnstile requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate Turnstile token on the server
    const turnstileSecretKey = env.TURNSTILE_SECRET_KEY || import.meta.env.TURNSTILE_SECRET_KEY;
    if (!turnstileSecretKey) {
      console.error('TURNSTILE_SECRET_KEY no configurada');
      return new Response(
        JSON.stringify({ error: 'Error en la configuración del servidor' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const turnstileValidationResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: turnstileSecretKey,
          response: turnstileToken
        })
      }
    );

    const turnstileResult = await turnstileValidationResponse.json();

    if (!turnstileResult.success) {
      console.error('Turnstile validation failed:', turnstileResult);
      return new Response(
        JSON.stringify({ 
          error: 'Validación de seguridad fallida',
          details: turnstileResult['error-codes'] || []
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If Turnstile validation passed, return the Web3Forms access key
    // We CANNOT send the request from the server because Web3Forms free tier blocks Node.js (returns 403 Cloudflare challenge)
    const web3formsAccessKey = env.WEB3FORMS_ACCESS_KEY || import.meta.env.WEB3FORMS_ACCESS_KEY;
    if (!web3formsAccessKey) {
      console.error('WEB3FORMS_ACCESS_KEY no configurada');
      return new Response(
        JSON.stringify({ error: 'Error en la configuración del servidor' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        accessKey: web3formsAccessKey
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Contact API error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
