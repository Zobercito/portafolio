# AGENTS.md

<!-- opencode-bootstrap:start -->

## Proyecto

- **Stack:** node (react, astro, tailwind, playwright, typescript)
- **Gestor de paquetes:** npm

## Comandos

| Acción   | Comando            |
| -------- | ------------------ |
| dev      | `npm run dev`      |
| build    | `npm run build`    |
| test     | `npm test`         |
| test:csp | `npm run test:csp` |
| test:e2e | `npm run test:e2e` |

## Definición de terminado

Un cambio está terminado cuando el comando real de verificación se ha
ejecutado y ha pasado. No vale «debería funcionar».
<!-- opencode-bootstrap:end -->

## Arquitectura

- Astro 7 con `output: 'server'` sobre Cloudflare Workers. La landing (`src/pages/index.astro`) se prerenderiza; `src/pages/api/*` y el 404 corren en el Worker. React 19 solo en islas (`client:*`).
- Config del Worker: `wrangler.deploy.toml` (no `wrangler.toml`). `astro.config.mjs` lo carga vía `platformProxy.configPath`. Bindings: `SESSION` (KV, rate limit y sesiones de chat), `IMAGES`, `ASSETS`.
- Variables y secretos: ver `.env.example`. Se leen con `src/utils/env.ts` (`cloudflare:workers`), no con `process.env`.
- Flujo del chat: `chatSessionClient` → `/api/chat/session` (Turnstile) → header `x-chat-session` → `/api/chat` (SSE, Groq).
- `isChatGuardEnabled()` es `Boolean(TURNSTILE_SECRET_KEY)`. Sin esa variable, `/api/chat` y `/api/title` no exigen sesión.
- Prompt del chat en `src/data/chatbot-context.ts`. Si cambia `PORTFOLIO_SYSTEM_PROMPT_VERSION`, ejecuta `npm run eval` (necesita `GROQ_API_KEY`; casos en `eval/cases.ts`).

## Trampas

- **CSP**: se aplica en serio y `script-src` no permite `'unsafe-inline'`. `npm run build` ejecuta `scripts/apply-csp.mjs`, que hashea los scripts inline del HTML prerenderizado y reescribe la línea CSP de `dist/client/_headers`. Un script inline nuevo o condicional sin hash deja la landing sin hidratar.
- Orígenes externos nuevos (imágenes, scripts, fuentes): editar `src/utils/securityHeaders.ts` y `public/_headers` a la vez, reconstruir y correr `npm run test:csp`.
- `astro dev` emite la CSP como `Report-Only` y con otros inline. `npm run build` solo no valida la CSP; `test:csp` es la única prueba sobre el artefacto real (`wrangler dev -c wrangler.deploy.toml`, puerto 8788).
- `vite.resolve.alias` redirige `tty`, `util` y `path` a `src/empty.js`, y hace falta `nodejs_compat`. Es necesario para `groq-sdk` en Workers. Conservar al actualizar dependencias.
- `getClientIp` (`src/utils/http.ts`) devuelve `'unknown'` sin `cf-connecting-ip` ni `cf-ray`. En local todas las peticiones comparten esa cuota de rate limit.
- `.agents/`, `.claude/`, `.continue/` y `.kiro/` contienen symlinks circulares. Vite los ignora en `server.watch.ignored`; si quitas ese bloque, `astro dev` inunda de errores `ELOOP`.
- `astro dev` suele quedar ocupando el puerto 4321. Playwright usa `reuseExistingServer` fuera de CI y reutilizaría ese servidor.
- El beacon de Cloudflare Web Analytics lo inyecta el edge. No existe en local, así que un bloqueo de CSP sobre él solo aparece en producción.

## Tests

- Unitarios: `npm test` (`node --test tests/*.test.mjs`). Uno solo: `node --test tests/http.test.mjs`.
- E2E: `npm run test:e2e` levanta `npm run dev`. Corre `prime` primero (calienta Vite) y luego `mobile` y `desktop`. Usa `reducedMotion: 'reduce'` y una sitekey de Turnstile de prueba. Los snapshots de `tests/e2e/*-snapshots` se generan con la imagen `mcr.microsoft.com/playwright:v1.64.1-noble`, igual que CI. Regenerarlos en otro SO produce diffs falsos.
- CI (`.github/workflows/ci.yml`): `check` → `test` → `build`; además `e2e` y `csp` en jobs aparte. Orden local equivalente: `npm run check && npm test && npm run build`.
- `npm run smoke` revisa producción (cabeceras, `/api/config`, sesión en `/api/chat`, sitemap, robots, 404). No envía correos.

## Convenciones

- Commits en español con prefijo Conventional Commits (`fix(csp): ...`, `perf(scroll): ...`).
- Hooks de Husky (`.husky/`) usan `lint-staged`; `pre-push` corre `check`, `test` y `build`. `git commit --no-verify` los salta.
- El sitio es solo oscuro por diseño (zinc-950). No añadas modo claro ni toggle de tema.
- `plan.md` está en `.gitignore` (planificación local).
