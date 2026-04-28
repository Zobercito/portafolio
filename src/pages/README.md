# Pages Directory (Routes)

This directory defines the routing structure of the Astro site.

## 🗺️ Routing Logic

- **`index.astro`**: The entry point of the portfolio (Home Page). It assembles all the sections into the final layout.
- **`/api`**: Contains server-side endpoints (Astro API Routes).
  - `chat.ts`: Handles communication with the AI models via Groq.
  - `contact.ts`: Processes the Web3Forms contact form and Turnstile verification.
  - `title.ts`: Utility for dynamic AI chat title generation.

## 🚀 Astro Routing
Astro uses a file-based routing system. Any `.astro` or `.md` file in this directory becomes a public URL.

---
> [!NOTE]
> For interactive logic on these pages, we use React components with client hydration directives.
