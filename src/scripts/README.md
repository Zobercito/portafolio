# Scripts Directory (Vanilla JS)

This directory contains client-side JavaScript logic that doesn't require a full React component.

## 📜 Key Scripts

- **`contactForm.ts`**: Handles the submission, validation, and feedback loop for the contact section.
- **`slideEngine.ts`**: Custom logic for carousel/slider transitions throughout the site.
- **`spaceCanvas.ts`**: The background animation engine (Starfields, particles, etc.) using the HTML5 Canvas API.

## ⚙️ Usage
These scripts are typically imported directly into Astro components or layouts using `<script>` tags:
```typescript
import '../scripts/spaceCanvas.ts';
```

---
> [!IMPORTANT]
> As per [AGENTS.md](file:///h:/Fran/MEGA/Proyectos_Prog/Proyectos_Personales/Portafolio/AGENTS.md), always perform null-checks on DOM elements before manipulation.
