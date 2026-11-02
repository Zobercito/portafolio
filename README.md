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
   ```

   CI runs the same three commands on every push and pull request (`.github/workflows/ci.yml`).