import { expect, test, type Page } from '@playwright/test';
import { assertNoViteErrorOverlay } from './hydration';

function captchaRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('challenges.cloudflare.com')) urls.push(request.url());
  });
  return urls;
}

test('la landing llega prerenderizada con sus cabeceras de seguridad', async ({ page }) => {
  const response = await page.goto('/');

  expect(response?.status()).toBe(200);
  const headers = response?.headers() ?? {};
  expect(headers['content-security-policy-report-only']).toContain("default-src 'self'");
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['strict-transport-security']).toContain('max-age=');
  await expect(page).toHaveTitle(/Francisco González/);
  await expect(page.locator('[data-slider-track] h1')).toBeVisible();
});

test('la navegación por hash lleva a la sección pedida', async ({ page }) => {
  await page.goto('/#contact');

  await expect(page.locator('#contact')).toBeInViewport();
  await expect(page.getByRole('heading', { name: 'Contáctame' })).toBeVisible();
});

test('el runtime de Turnstile no se descarga en la portada', async ({ page }) => {
  const requests = captchaRequests(page);

  await page.goto('/');

  expect(requests).toHaveLength(0);
});

test('el captcha aparece cuando el formulario de contacto se acerca', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'el formulario sólo se muestra desde xl');
  const requests = captchaRequests(page);

  await page.goto('/#contact');

  await expect.poll(() => requests.length, { timeout: 30_000 }).toBeGreaterThan(0);
});

test('en móvil la sección de contacto no descarga el captcha', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'la tarjeta de contacto es el camino de móvil');
  const requests = captchaRequests(page);

  await page.goto('/#contact');
  await expect(page.getByRole('link', { name: 'Envíame un mensaje' })).toBeVisible();
  await page.waitForTimeout(2_000);

  expect(requests).toHaveLength(0);
});

test('portada', async ({ page }) => {
  await page.goto('/');

  const hero = page.locator('#hero');
  await expect(hero.getByRole('heading', { level: 1 })).toContainText('González');
  await assertNoViteErrorOverlay(page);
  await expect(hero).toHaveScreenshot('portada.png', { maxDiffPixelRatio: 0.02 });
});
