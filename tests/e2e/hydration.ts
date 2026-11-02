import type { Page } from '@playwright/test';

/**
 * Astro envía las islas de React ya renderizadas en el servidor y con el
 * atributo `ssr`: se pueden ver y pulsar antes de que React las hidrate, y el
 * click se pierde. Esperar a que la isla pierda ese atributo es la única señal
 * fiable de que la sección ya responde.
 */
export async function waitForIslandHydrated(page: Page, selector: string): Promise<void> {
  // Las islas `client:visible` sólo se hidratan al entrar en pantalla.
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.waitForFunction(
    (target) => {
      const element = document.querySelector(target);
      if (!element) return false;
      const island = element.closest('astro-island');
      return island === null || !island.hasAttribute('ssr');
    },
    selector,
    { timeout: 60_000 },
  );
  await assertNoViteErrorOverlay(page);
}

/**
 * El overlay de error de Vite cubre toda la ventana: si aparece durante una
 * captura, sus píxeles se quedan grabados como baseline.
 */
export async function assertNoViteErrorOverlay(page: Page): Promise<void> {
  if ((await page.locator('vite-error-overlay').count()) === 0) return;

  const detail = await page.evaluate(() => {
    const overlay = document.querySelector('vite-error-overlay');
    const message = (overlay as { message?: { message?: string } } | null)?.message?.message;
    const body = overlay?.shadowRoot?.querySelector('.message-body')?.textContent ?? '';
    return `${message ?? ''}\n${body}`.trim().slice(0, 600);
  });
  throw new Error(`El dev server lanzó un error de compilación:\n${detail}`);
}
