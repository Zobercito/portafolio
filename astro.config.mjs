// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';

const emptyModule = fileURLToPath(new URL('./src/empty.js', import.meta.url));

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
      configPath: 'wrangler.deploy.toml',
    },
  }),
  vite: {
    resolve: {
      conditions: ['workerd', 'worker', 'browser'],
      alias: {
        tty: emptyModule,
        util: emptyModule,
        path: emptyModule,
        'node:tty': emptyModule,
        'node:util': emptyModule,
        'node:path': emptyModule,
      },
    },
    plugins: [tailwindcss()],
    server: {
      watch: {
        ignored: ['**/.agents/**', '**/.claude/**', '**/.continue/**', '**/.kiro/**'],
      },
    },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: false,
          pure_funcs: ['console.debug'],
        },
      },
    },
    optimizeDeps: {
      include: ['react-dom/client', 'react-dom'],
    },
    ssr: {
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react-dom/server',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          '@astrojs/react/server.js',
        ],
      },
    },
  },
  integrations: [react()],
});
