# 🚀 Francisco González | Developer Portfolio 

This is my professional portfolio, designed to be fast, minimalist, and highly functional. Built with **Astro 6**, **React 19**, and **Tailwind CSS 4**, it prioritizes performance and a seamless user experience through a modern SSR architecture.

---

## ✨ Key Features

- 🤖 **AI MiniChat:** An interactive assistant supporting multiple models (including **GPT OSS 20B** and **Llama 3**) to answer questions about my professional background.
- ⚡ **Extreme Performance:** Powered by **Astro 6** and **Tailwind 4** for lightning-fast builds and zero-JS by default (where possible).
- 📂 **Data-Driven:** All content (experience, projects, education) is decoupled from the UI, living in `src/data/` for easy updates.
- 🎨 **Premium UI/UX:** Native dark mode, glassmorphism effects, and syntax highlighting for code snippets in chat.

## 🛠️ Tech Stack

- **Framework:** Astro 6 (Node.js SSR Adapter)
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4
- **AI Integration:** Groq SDK (Llama 3.1, Llama 3.3, and GPT OSS)
- **Forms & Security:** Web3Forms + Cloudflare Turnstile

---

## 📁 Project Structure

```text
/
├── public/              # Static assets (Images, Certs, Favicon)
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
- **Node.js** (v18.14.1+)
- **npm** or **pnpm**

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
   WEB3FORMS_ACCESS_KEY=your_key
   PUBLIC_TURNSTILE_SITE_KEY=your_key
   TURNSTILE_SECRET_KEY=your_key
   ```
   *Note: A mock Groq client is provided for local development if keys are missing.*

3. **Run Dev:**
   ```sh
   npm run dev
   ```