# Data Directory (The "Portfolio Database")

This directory acts as the central source of truth for all content displayed in the portfolio, as well as AI configuration.

## 📝 How to Update Content

You don't need to dive into the UI code to change your information. Just edit the files here:

- **`experienceData.ts`**: The main file containing your Work Experience, Education, Projects, Certificates, and Stack Icons.
- **`chatModels.ts`**: Defines the AI models available in the MiniChat (e.g., Llama 3, GPT OSS).
- **`chatbot-context.ts`**: Contains the System Prompt that gives the AI its personality and instructions.
- **`icons.ts` / `rocketSvg.ts`**: SVG paths and icon definitions used across the site.

## 🛠️ Maintenance

When adding new entries, ensure they follow the established **TypeScript Interfaces** to maintain type safety throughout the application.

---
> [!TIP]
> This "Data-First" approach makes it extremely easy to maintain the portfolio without risking breaking the layout or styles.
