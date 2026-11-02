// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // Canonical origin used for SEO tags and the sitemap.
  site: 'https://zobercito.dev',
  output: 'server',
  adapter: cloudflare({
    // @ts-ignore
    platformProxy: {
      enabled: true,
      configPath: 'wrangler.deploy.toml'
    }
  }),
  vite: {
    resolve: {
      conditions: ['workerd', 'worker', 'browser'],
      // groq-sdk imports Node builtins that do not exist in Workers. They are
      // only used by Node-specific code paths, so they are aliased to a no-op
      // module to keep the Worker bundle buildable. Revisit if the SDK starts
      // requiring real implementations of these modules.
      alias: {
        'tty': '/src/empty.js',
        'util': '/src/empty.js',
        'path': '/src/empty.js',
        'node:tty': '/src/empty.js',
        'node:util': '/src/empty.js',
        'node:path': '/src/empty.js'
      }
    },
    // @ts-ignore
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['react-dom/client', 'react-dom']
    }
  },
  integrations: [react()]
});