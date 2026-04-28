// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    }
  }),
  vite: {
    // @ts-ignore
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['react-dom/client', 'react-dom']
    }
  },
  integrations: [react()]
});