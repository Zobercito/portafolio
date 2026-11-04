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
      alias: {
        'tty': '/src/empty.js',
        'util': '/src/empty.js',
        'path': '/src/empty.js',
        'node:tty': '/src/empty.js',
        'node:util': '/src/empty.js',
        'node:path': '/src/empty.js'
      }
    },
    plugins: [tailwindcss()],
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: false,
          pure_funcs: ['console.debug']
        }
      },
      brotliSize: false
    },
    optimizeDeps: {
      include: ['react-dom/client', 'react-dom']
    },
    ssr: {
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react-dom/server',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          '@astrojs/react/server.js'
        ]
      }
    }
  },
  integrations: [react()]
});