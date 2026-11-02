import { defineMiddleware } from 'astro:middleware';
import { SECURITY_HEADERS } from './utils/securityHeaders';

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  if (response.status === 101) return response;

  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
