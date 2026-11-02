import { expect, test, type Page } from '@playwright/test';

interface Violation {
  directive: string;
  blocked: string;
  sample: string;
}

/**
 * Estas pruebas corren sobre el build de producción servido por wrangler, no
 * sobre `astro dev`: la CSP con hashes sólo existe en el build. Lo que se
 * comprueba es que el navegador no rechace nada al cargar e hidratar la página.
 */
test.beforeEach(async ({ page }) => {
  blockedByCsp.length = 0;
  // Chrome no siempre dispara el evento cuando el bloqueo ocurre en el destino
  // de una redirección (el avatar de GitHub es un 302), pero sí falla la
  // petición con net::ERR_BLOCKED_BY_CSP.
  page.on('requestfailed', (request) => {
    if ((request.failure()?.errorText ?? '').toUpperCase().includes('CSP')) {
      blockedByCsp.push(`${request.url()} ${request.failure()?.errorText}`);
    }
  });

  await page.addInitScript(() => {
    const store = window as unknown as { __cspViolations: Violation[] };
    store.__cspViolations = [];

    const record = (event: Event) => {
      const detail = event as unknown as Record<string, unknown>;
      store.__cspViolations.push({
        directive: String(detail.effectiveDirective ?? detail.violatedDirective ?? '?'),
        blocked: String(detail.blockedURL ?? detail.blockedURI ?? detail.sourceURL ?? '(sin URL)'),
        sample: String(detail.sample ?? '').slice(0, 60),
      });
    };

    window.addEventListener('securitypolicyviolation', record);
    document.addEventListener('securitypolicyviolation', record);
  });
});

async function violations(page: Page): Promise<Violation[]> {
  return page.evaluate(
    () => (window as unknown as { __cspViolations: Violation[] }).__cspViolations,
  );
}

const blockedByCsp: string[] = [];

async function expectCspLimpia(page: Page): Promise<void> {
  expect(blockedByCsp).toEqual([]);
  expect(await violations(page)).toEqual([]);
}

test('la landing hidrata sin violar la CSP', async ({ page }) => {
  // `#about` coloca la isla del chat en pantalla: es `client:visible` y sólo ahí
  // se hidrata. La de "Experiencia" queda fuera de la ventana a propósito.
  const response = await page.goto('/#about');
  const csp = response?.headers()['content-security-policy'] ?? '';
  expect(csp).toContain("default-src 'self'");

  // `style-src` sí conserva unsafe-inline (los `style=` del HTML prerenderizado);
  // lo que no puede aparecer es en `script-src`.
  const scriptSrc = csp.split(';').find((directive) => directive.trim().startsWith('script-src'));
  expect(scriptSrc).toBeDefined();
  expect(scriptSrc).not.toContain('unsafe-inline');
  expect(scriptSrc).toContain("'sha256-");

  // Señal de que los cargadores inline se ejecutaron de verdad: el motor del
  // slider mueve el track por CSSOM y la isla del chat pierde el atributo `ssr`.
  const input = page.locator('[aria-label="Mensaje para el asistente"]');
  await input.waitFor({ state: 'visible', timeout: 30_000 });
  await page.waitForFunction(
    () => {
      const field = document.querySelector('[aria-label="Mensaje para el asistente"]');
      const island = field?.closest('astro-island');
      return Boolean(island) && !island!.hasAttribute('ssr');
    },
    undefined,
    { timeout: 30_000 },
  );
  await input.fill('probando la CSP');
  await expect(input).toHaveValue('probando la CSP');

  // El motor del slider ignora el teclado mientras hay un campo enfocado.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-slider-track]')).toHaveCSS(
    'transform',
    /matrix\(1, 0, 0, 1, 0, -(?:[1-9]\d{2,})\)/,
  );

  await expectCspLimpia(page);
});

test('el captcha de Turnstile se carga desde su origen permitido', async ({ page }) => {
  const requested = page.waitForRequest(
    (request) => request.url().includes('challenges.cloudflare.com'),
    { timeout: 20_000 },
  );

  await page.goto('/#contact');

  // El widget sólo se inyecta cuando el formulario entra en pantalla. Si la CSP
  // no autorizara challenges.cloudflare.com, la petición no llegaría a empezar.
  await expect(requested).resolves.toBeTruthy();

  // El avatar de GitHub es el recurso externo que más se ha escapado: si la CSP
  // no autoriza el destino de su 302, se ve roto sin ningún error en consola.
  const avatar = page.locator('img[alt^="Avatar de GitHub"]');
  await avatar.waitFor({ state: 'attached', timeout: 15_000 });
  await expect.poll(async () => avatar.evaluate((el) => (el as HTMLImageElement).naturalWidth), {
    timeout: 15_000,
  }).toBeGreaterThan(0);

  await expectCspLimpia(page);
});

test('el 404 del Worker trae la CSP que aplica y no viola nada', async ({ page }) => {
  const response = await page.goto('/ruta-que-no-existe');
  expect(response?.status()).toBe(404);
  expect(response?.headers()['content-security-policy']).toContain("script-src 'self' https://");

  await expectCspLimpia(page);
});
