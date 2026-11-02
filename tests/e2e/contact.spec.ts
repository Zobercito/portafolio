import { expect, test, type Page } from '@playwright/test';
import { assertNoViteErrorOverlay } from './hydration';

// Turnstile resuelve la sitekey de pruebas sin interactuar: deja el token en su
// input oculto y quita el iframe. Ese input es la señal estable, no el iframe.
const tokenField = '[name="cf-turnstile-response"]';

test.beforeEach(async ({}, testInfo) => {
  // Bajo el breakpoint xl la tarjeta del formulario no se muestra: en móvil la
  // sección ofrece un mailto y el captcha ni siquiera se descarga.
  test.skip(testInfo.project.name !== 'desktop', 'el formulario existe sólo en escritorio');
});

async function gotoContact(page: Page) {
  await page.goto('/#contact');
  await expect(page.locator(tokenField)).toHaveValue(/.+/, { timeout: 30_000 });
}

test('el captcha se monta en su sitio y habilita el envío', async ({ page }) => {
  await gotoContact(page);

  // La sitekey de pruebas de Cloudflare pasa sola: el botón deja de estar bloqueado.
  const submit = page.locator('[data-submit-btn]');
  await expect(submit).toBeEnabled({ timeout: 30_000 });
  await expect(submit).toHaveText('Enviar mensaje');
});

test('el formulario sigue bloqueado mientras el captcha no haya pasado', async ({ page }) => {
  await page.route('**://challenges.cloudflare.com/**', (route) => route.abort());
  await page.goto('/#contact');

  const submit = page.locator('[data-submit-btn]');
  await expect(submit).toBeVisible();
  await expect(submit).toBeDisabled();
  await expect(submit).toHaveText('Completa el captcha para enviar');
  await expect(page.locator(tokenField)).toHaveCount(0);
});

test('contacto', async ({ page }) => {
  await gotoContact(page);

  await assertNoViteErrorOverlay(page);
  await expect(page.locator('#contact')).toHaveScreenshot('contacto.png', {
    maxDiffPixelRatio: 0.05,
  });
});
