// ─── FULL-PAGE SLIDE ENGINE ──────────────────────────────────────────────
// Manages vertical full-page scroll-snapping via CSS transform.
// Navigation is exposed through the typed `portfolio:navigate` event so React
// components never depend on a global function.

import { NAVIGATE_EVENT, sectionHash } from "../utils/navigation";

const ANIM_MS = 800; // Should closely match the CSS transition duration

export function initSlideEngine() {
  // Count sections from the DOM so this never goes stale when new sections are added
  const sections = Array.from(
    document.querySelectorAll<HTMLElement>("[data-section]"),
  );
  const TOTAL = sections.length;
  const trackEl = document.querySelector("[data-slider-track]");

  if (!(trackEl instanceof HTMLElement) || TOTAL === 0) return;
  const track = trackEl;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let current = 0;
  let isAnimating = false;

  function sectionIdForLink(link: Element): string {
    const href = link.getAttribute("href") ?? "";
    return href === "/" ? "hero" : href.replace(/^#/, "");
  }

  function updateNav(index: number) {
    const activeId = sections[index]?.id;
    document.querySelectorAll(".nav-link").forEach((link) => {
      const el = link as HTMLElement;
      if (sectionIdForLink(el) === activeId) {
        el.classList.add("bg-zinc-800/60", "text-zinc-100");
        el.classList.remove("text-zinc-400");
      } else {
        el.classList.remove("bg-zinc-800/60", "text-zinc-100");
        el.classList.add("text-zinc-400");
      }
    });
  }

  function goTo(index: number, updateHash = true) {
    if (isAnimating) return;
    if (index < 0 || index >= TOTAL) return;
    isAnimating = true;
    current = index;
    track.style.transform = `translateY(-${current * 100}svh)`;
    updateNav(current);

    if (updateHash) {
      history.replaceState(null, "", sectionHash(sections[current].id, current));
    }

    setTimeout(() => {
      isAnimating = false;
    }, motionQuery.matches ? 0 : ANIM_MS);
  }

  function indexFromHash(hash: string): number {
    const id = hash.replace(/^#/, "");
    if (!id) return 0;
    return sections.findIndex((section) => section.id === id);
  }

  // Initial nav highlight and deep-link resolution
  const initialIndex = indexFromHash(window.location.hash);
  if (initialIndex > 0) goTo(initialIndex, false);
  else updateNav(current);

  window.addEventListener(NAVIGATE_EVENT, (event) => {
    const index = (event as CustomEvent<number>).detail;
    if (typeof index === "number") goTo(index);
  });

  window.addEventListener("popstate", () => {
    const index = indexFromHash(window.location.hash);
    goTo(index >= 0 ? index : 0, false);
  });

  // Mouse wheel / Trackpad
  window.addEventListener(
    "wheel",
    (e) => {
      // Do not navigate if a modal is open or the user is scrolling the chat
      const target = e.target as HTMLElement | null;
      if (
        document.querySelector('[role="dialog"][aria-modal="true"]') ||
        (target && target.closest("[data-chat-scroll]"))
      )
        return;

      e.preventDefault();
      if (isAnimating) return;
      if (e.deltaY > 0) goTo(current + 1);
      else if (e.deltaY < 0) goTo(current - 1);
    },
    { passive: false },
  );

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    // Do not navigate if the user is typing in the chat
    const target = e.target as HTMLElement | null;
    if (target && target.closest && target.closest("[data-chat-scroll]")) return;

    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (isAnimating) return;

    // Do not navigate while a modal dialog is open
    if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;

    if (e.key === "ArrowDown" || e.key === "PageDown") {
      e.preventDefault();
      goTo(current + 1);
    }
    if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      goTo(current - 1);
    }
  });

  // Touch swipe navigation
  let touchY = 0;
  window.addEventListener(
    "touchstart",
    (e) => {
      touchY = e.touches[0].clientY;
    },
    { passive: true },
  );
  window.addEventListener(
    "touchend",
    (e) => {
      // Do not navigate if swiping inside a modal or the chat
      const target = e.target as HTMLElement | null;
      if (
        document.querySelector('[role="dialog"][aria-modal="true"]') ||
        (target && target.closest("[data-chat-scroll]"))
      )
        return;

      const delta = touchY - e.changedTouches[0].clientY;
      if (Math.abs(delta) < 50) return;
      if (delta > 0) goTo(current + 1);
      else goTo(current - 1);
    },
    { passive: true },
  );

  // Navbar link click navigation
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = sectionIdForLink(link);
      const index = sections.findIndex((section) => section.id === targetId);
      if (index < 0) return;
      e.preventDefault();
      goTo(index);
    });
  });
}
