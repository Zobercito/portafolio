---
trigger: always_on
---

# AGENTS.md — Portfolio Arch & Coding Guidelines

This file outlines the core rules for AI agents working on this Astro + React + Tailwind portfolio. Read carefully.

## 1. Language Policy
- **Code & Dev-facing**: English (Variable/function/class names, TypeScript interfaces, Comments, `console.log`, JSX `{/* */}` comments, HTML IDs/Classes).
- **User-facing**: Spanish (Visible text, UI labels, paragraphs, `alt`/`title`/`aria-label` attributes).

## 2. Project Architecture & Standards
- **Componentization**: Avoid "God Components". Keep components small. Extract complex state, API calls, and logic (like `requestAnimationFrame` or intervals) into custom React Hooks in `src/hooks/`.
- **Data Modules**: Static content (projects, experiences, constants) belongs in `src/data/`, not hardcoded inside React components.
- **Tailwind CSS**: Prefer utility classes over inline `style=""`. Do not use arbitrary custom classes in `global.css` unless strictly necessary and currently used.

## 3. Astro-Specific Rules
- **Frontmatter**: The block between `---` in `.astro` files is TypeScript.
- **Vanilla JS**: `<script is:inline>` runs in the browser and does NOT have access to React hooks or TS types. Extract complex Astro client logic into dedicated script files in `src/scripts/` when possible.
- **Hydration**: React components that mount and require immediate JS interaction MUST use `client:load` (e.g., `<NameTypewriter client:load />`).

## 4. Strict Cleanup & "Dead Code" Policy
- **Iterative Replacement**: Whenever you replace an old function, component, or logic block with a better one, **delete the old code immediately**. Never leave commented-out legacy code or orphaned files.
- **Unused Types/Classes**: Remove interface properties, type union members, or CSS classes that are no longer actively used in the DOM.
- **Configs/Artifacts**: Never commit temporal tunneling configs (e.g., ngrok `allowedHosts` in `astro.config.mjs`) or generated local txt files. Revert them before ending your session.

## 5. Defensive Programming
- **DOM Queries**: Always perform null-checks on `document.getElementById` or `querySelector` before accessing properties.
- **Event Listeners**: Always use named functions for event listeners if you need to `removeEventListener` later. Do not pass anonymous arrow functions directly.

> **Final Checklist before ending execution:** Are there any leftover `console.log`s? Are there unused imports? Did you delete the replaced code? Is the build error-free?
