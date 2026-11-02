import type { APIRoute } from 'astro';
import { readEnvValue, isChatGuardEnabled } from '../../utils/env';
import { jsonResponse } from '../../utils/http';
import type { PublicConfigResponse } from '../../types/api';

export const prerender = false;

/**
 * Public runtime configuration. Lets the prerendered landing read the
 * Turnstile sitekey from Cloudflare vars instead of baking it at build time.
 */
export const GET: APIRoute = async () => {
  const body: PublicConfigResponse = {
    turnstileSitekey: readEnvValue('PUBLIC_TURNSTILE_SITE_KEY') ?? '',
    chatGuardEnabled: isChatGuardEnabled(),
  };

  return jsonResponse(body, 200, { 'Cache-Control': 'public, max-age=300' });
};
