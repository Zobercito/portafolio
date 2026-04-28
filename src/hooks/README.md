# Custom Hooks Directory

This directory contains the business logic and state management of the application, separated from the UI components.

## 🧠 Why Hooks?

We use custom hooks to:
1. **Promote Reusability:** Logic like chat engines or modal state can be used across different components.
2. **Clean Components:** Keep JSX files focused on *how things look*, while hooks focus on *how things work*.
3. **Easier Testing:** Logic isolated in hooks is easier to unit test.

## 🔑 Key Hooks
- **AI / Chat Hooks:** `useChatEngine.ts` (state management), `useChatStreaming.ts` (API connection), `useChatHistory.ts`.
- **UI / Layout Hooks:** `useCarousel.ts` (slider logic), `useModalAnimation.ts` (smooth transitions), `useBodyScrollLock.ts`.

---
> [!NOTE]
> Always prefix files with `use` (e.g., `useMyLogic.ts`) as per React conventions.
