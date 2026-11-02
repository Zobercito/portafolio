import { expect, test } from '@playwright/test';
import { waitForIslandHydrated, assertNoViteErrorOverlay } from './hydration';

test.beforeEach(async ({ page }) => {
  await page.goto('/#about');
  await waitForIslandHydrated(page, '[aria-label="Mensaje para el asistente"]');
});

test('el chat responde una sola vez con el stream completo', async ({ page }) => {
  const input = page.locator('[aria-label="Mensaje para el asistente"]');
  await expect(input).toBeVisible();

  await input.fill('¿En qué stack trabajas?');
  await page.locator('[aria-label="Enviar mensaje"]').click();

  const reply = page.getByText('Respuesta de desarrollo', { exact: false });
  await expect(reply).toBeVisible({ timeout: 30_000 });
  await expect(reply).toHaveCount(1);

  // El input vuelve a quedar libre al terminar el stream.
  await expect(input).toBeEnabled({ timeout: 30_000 });
});

test('el selector ofrece los modelos del catálogo', async ({ page }) => {
  const trigger = page.locator('[aria-label^="Cambiar modelo de IA:"]');
  await expect(trigger).toBeVisible();

  await trigger.click();
  const menu = page.getByRole('menu');
  await expect(menu.getByText('GPT OSS 120B')).toBeVisible();
  await expect(menu.getByText('Qwen 3.8 27B')).toBeVisible();
});

test('el chat abierto responde', async ({ page }) => {
  const input = page.locator('[aria-label="Mensaje para el asistente"]');
  await input.fill('Hola');
  await page.locator('[aria-label="Enviar mensaje"]').click();
  await expect(page.getByText('Respuesta de desarrollo')).toBeVisible({ timeout: 30_000 });

  const container = page.locator('#minichat-container');
  await assertNoViteErrorOverlay(page);
  await expect(container).toHaveScreenshot('chat.png', { maxDiffPixelRatio: 0.05 });
});
