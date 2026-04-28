# Layouts Directory

This directory contains the structural templates of the portfolio.

## 🏗️ Base Structure

- **`BaseLayout.astro`**: The primary wrapper for the entire application. It handles:
  - Global `<head>` configuration (Meta tags, SEO, Favicons).
  - Common font imports (Google Fonts).
  - Navigation and Footer placement.
  - The main `<slot />` where page content is injected.

## 🎨 Best Practices
- Keep layouts generic enough to be reused across different pages.
- Inject global styles and scripts here to ensure consistency.

---
> [!TIP]
> This is the perfect place to manage global state that doesn't need React (like theme preferences or SEO defaults).
