// ─── FULL-PAGE SLIDE ENGINE ──────────────────────────────────────────────
// Manages vertical full-page scroll-snapping via CSS transform.
// Exposes window.goToSlide for use by React components (e.g. NameTypewriter).

const ANIM_MS = 800; // Should closely match the CSS transition duration

export function initSlideEngine() {
  // Count sections from the DOM so this never goes stale when new sections are added
  const TOTAL = document.querySelectorAll("[data-section]").length;
  const track = document.querySelector("[data-slider-track]") as HTMLElement | null;

  let current = 0;
  let isAnimating = false;

  function updateNav(index: number) {
    document.querySelectorAll(".nav-link").forEach((link, i) => {
      const el = link as HTMLElement;
      if (i === index) {
        el.classList.add("bg-zinc-800/60", "text-zinc-100");
        el.classList.remove("text-zinc-400");
      } else {
        el.classList.remove("bg-zinc-800/60", "text-zinc-100");
        el.classList.add("text-zinc-400");
      }
    });
  }

  function goTo(index: number) {
    if (isAnimating) return;
    if (index < 0 || index >= TOTAL) return;
    if (!track) return;
    isAnimating = true;
    current = index;
    track.style.transform = `translateY(-${current * 100}svh)`;
    updateNav(current);
    setTimeout(() => {
      isAnimating = false;
    }, ANIM_MS);
  }

  // Expose goTo globally so React components can call window.goToSlide(n)
  window.goToSlide = goTo;

  // Set initial nav highlight
  updateNav(current);

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
      const href = link.getAttribute("href");
      if (!href) return;
      const targetEl =
        href === "/"
          ? document.getElementById("hero")
          : document.querySelector(href);
      if (!targetEl) return;
      e.preventDefault();
      const sectionIdx = (targetEl as HTMLElement).dataset.section;
      if (sectionIdx) {
        const idx = parseInt(sectionIdx, 10);
        if (!isNaN(idx)) goTo(idx);
      }
    });
  });
}
