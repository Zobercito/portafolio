import { expect, test, type Page } from '@playwright/test';

// Vite optimiza las dependencias de React la primera vez que ve cada isla. Si
// varios workers piden páginas a la vez, esa re-optimización corta la carga en
// curso y deja el overlay de error. Este proyecto recorre las secciones antes
// de que arranquen los demás para que el dev server llegue templado.
test.describe.configure({ mode: 'serial' });

async function loadClean(page: Page, path: string) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    await page.goto(path);
    await page.waitForTimeout(750);
    if ((await page.locator('vite-error-overlay').count()) === 0) return;
  }
  throw new Error(`El dev server no compila ${path} sin errores tras 4 intentos`);
}

for (const path of ['/', '/#about', '/#experience', '/#contact']) {
  test(`el dev server sirve ${path} sin errores de compilación`, async ({ page }) => {
    await loadClean(page, path);
    await expect(page.locator('#hero, [data-slider-track] h1').first()).toBeVisible();
  });
}
