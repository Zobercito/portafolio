// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    // @ts-ignore
    platformProxy: {
      enabled: true
    }
  }),
  vite: {
    // @ts-ignore
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['react-dom/client', 'react-dom']
    },
    build: {
      // @ts-ignore
      sourcemap: true
    }
  },
  integrations: [react()]
});