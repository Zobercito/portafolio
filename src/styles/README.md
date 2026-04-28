# Styles Directory

This directory manages the visual appearance and design tokens of the portfolio.

## 🎨 Styling System

- **`global.css`**: The main entry point for CSS. It includes:
  - Tailwind 4 import (`@import "tailwindcss";`).
  - Custom CSS variables for the color palette (Dark Mode focused).
  - Global resets, animations, and custom scrollbars.

## 🛠️ Tailwind Integration
Most of the styling is done via Tailwind utility classes directly in the components. We use the **Tailwind CSS 4 Vite plugin**, which simplifies configuration and performance. Custom classes should be avoided unless absolutely necessary for complex animations or third-party integrations.

---
> [!TIP]
> Use the CSS variables defined in `global.css` to keep colors consistent across both Tailwind classes and custom Canvas-based animations.
