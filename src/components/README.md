# UI Components Directory

This directory contains all the visual building blocks of the portfolio.

## 🏗️ Architecture Rules

As per our [AGENTS.md](file:///h:/Fran/MEGA/Proyectos_Prog/Proyectos_Personales/Portafolio/AGENTS.md), we follow these rules:

1. **Astro Components (.astro):** Used for static or server-side rendered sections. They provide the best performance as they send zero JavaScript to the browser by default.
2. **React Components (.tsx):** Used for interactive elements (Modals, Chat, Typewriters).
3. **Hydration Policy:** React components that need immediate interactivity MUST use the `client:load` directive (e.g., `<Chat client:load />`).
4. **Logic Separation:** Components should remain "presentational". Any complex state management or API calls should be extracted into **Custom Hooks** in `src/hooks/`.

## 📁 Sub-folders
- `/sections`: Large layout pieces (Hero, About, Contact).
- `/chat`: All components related to the AI MiniChat.
- `/modal`: Specialized modal handlers.

---
> [!IMPORTANT]
> When creating new components, ensure they are responsive and use Tailwind CSS for styling.
