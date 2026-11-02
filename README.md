# 🚀 Francisco González | Developer Portfolio 

This is my professional portfolio, designed to be fast, minimalist, and highly functional. Built with **Astro 6**, **React 19**, and **Tailwind CSS 4**, it prioritizes performance and a seamless user experience through a modern SSR architecture.

---

## ✨ Key Features

- 🤖 **AI MiniChat:** An interactive assistant supporting multiple models (including **GPT OSS 20B** and **Llama 3**) to answer questions about my professional background.
- ⚡ **Extreme Performance:** Powered by **Astro 6** and **Tailwind 4** for lightning-fast builds and zero-JS by default (where possible).
- 📂 **Data-Driven:** All content (experience, projects, education) is decoupled from the UI, living in `src/data/` for easy updates.
- 🎨 **Premium UI/UX:** Native dark mode, glassmorphism effects, and syntax highlighting for code snippets in chat.

## 🛠️ Tech Stack

- **Framework:** Astro 6 (Cloudflare Workers SSR adapter)
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4
- **AI Integration:** Groq SDK (GPT OSS 120B y Qwen 3.8 27B)
- **Forms & Security:** envío server-side con Resend + Cloudflare Turnstile

---

## 📁 Project Structure

```text
/
├── public/              # Static assets (Images, Certs, Favicon)
├── tests/               # Unit tests (node:test)
├── src/
│   ├── components/      # UI Components (Chat, Modals, Sections)
│   ├── data/            # Static content and AI model configuration
│   ├── hooks/           # Custom React logic (Streaming, State)
│   ├── layouts/         # Base page structures
│   ├── pages/           
│   │   ├── api/         # SSR API Endpoints (Chat, Contact, Titles)
│   │   └── index.astro  # Main Landing Page
│   ├── scripts/         # Client-side vanilla JS utilities
│   ├── styles/          # Global styles (Tailwind 4 entry)
│   ├── types/           # TypeScript definitions
│   └── utils/           # API clients and helpers (Groq)
├── astro.config.mjs     # Astro & Vite configuration
├── package.json         # Project dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v22.12 or newer)
- **npm** (the project pins npm via `packageManager`)

### Installation

1. **Clone and Setup:**
   ```sh
   git clone https://github.com/your-username/portfolio.git
   cd portfolio
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the root based on `.env.example`:
   ```env
   GROQ_API_KEY=your_api_key
   RESEND_API_KEY=your_api_key
   RESEND_FROM=contacto@tudominio.dev
   CONTACT_TO_EMAIL=tu-correo@tudominio.dev
   PUBLIC_TURNSTILE_SITE_KEY=your_key
   TURNSTILE_SECRET_KEY=your_key
   ```
   *Note: A mock Groq client is provided for local development if keys are missing.*

3. **Run Dev:**
   ```sh
   npm run dev
   ```

4. **Verify:**
   ```sh
   npm run check
   npm test
   npm run build
   npm run test:e2e
   ```

   CI runs the same commands on every push and pull request (`.github/workflows/ci.yml`).

   `test:e2e` are the Playwright specs in `tests/e2e`: they boot `astro dev` with
   Cloudflare's always-pass Turnstile sitekey, so no secrets are needed. The visual
   baselines in `tests/e2e/*-snapshots/` were rendered by the official Playwright
   image; regenerate them there when the UI really changes:

   ```sh
   docker run --rm -v "$PWD":/work -w /work --user "$(id -u):$(id -g)" \
     mcr.microsoft.com/playwright:v1.64.1-noble npx playwright test --update-snapshots
   ```

5. **Smoke post-despliegue:**
   ```sh
   npm run smoke                                # contra https://zobercito.dev
   node scripts/smoke.mjs https://otra-url.dev  # contra otra instancia
   ```
   Comprueba la landing prerrenderizada con sus cabeceras de seguridad, los
   assets inmutables, `/api/config`, que `/api/chat` exija sesión y que
   `/api/chat/session` y `/api/contact` rechacen un token de Turnstile falso,
   además de sitemap, robots y el 404. No envía correos ni gasta cuota de Groq.
   Se lanza a mano y a diario desde `.github/workflows/smoke.yml`.

6. **Evaluación del prompt del chat:**
   ```sh
   npm run eval                    # necesita GROQ_API_KEY en .env
   npm run eval -- --all-models    # los dos modelos del catálogo
   npm run eval -- --only receta   # sólo los ids que coincidan
   npm run eval -- --dry-run       # prueba el andamiaje sin red ni clave
   ```
   `eval/cases.ts` son 28 casos (datos del perfil, off-topic, inyección de
   prompt, estilo y contexto) y `src/utils/promptEval.ts` los puntúa por
   brevedad, corrección, tono y fugas. El runner manda el mismo `system` prompt
   y los mismos parámetros que `/api/chat`, sin clave en el repo: sale con
   código distinto de cero si algún caso falla. Sube
   `PORTFOLIO_SYSTEM_PROMPT_VERSION` cuando toques el texto para poder comparar
   corridas.