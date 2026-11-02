import { defineConfig, devices } from '@playwright/test';

// La CSP con hashes de script sólo existe sobre el build: `astro dev` sirve otros
// inline y la cabecera va en modo Report-Only. Este proyecto levanta el mismo
// artefacto que se despliega (Worker + assets estáticos vía wrangler).
const PORT = 8788;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/csp',
  fullyParallel: false,
  timeout: 90_000,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    reducedMotion: 'reduce',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'csp-build',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npx wrangler dev -c wrangler.deploy.toml --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
