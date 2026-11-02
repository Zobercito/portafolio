import { defineMiddleware } from 'astro:middleware';
import { SECURITY_HEADERS } from './utils/securityHeaders';

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  if (response.status === 101) return response;

  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    // `astro dev` mete scripts inline sin hash (los módulos de Vite y el
    // cargador de islas de desarrollo), así que ahí la CSP sólo puede informar.
    // Sobre el build ya no hay inline sin autorizar: se aplica de verdad.
    const header =
      import.meta.env.DEV && name === 'Content-Security-Policy'
        ? 'Content-Security-Policy-Report-Only'
        : name;
    headers.set(header, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
