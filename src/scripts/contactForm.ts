// ─── CONTACT FORM + ROCKET ANIMATION ────────────────────────────────────
// Handles Turnstile captcha rendering, form submission, and the decorative
// rocket launch sequence. Feedback is rendered inline (no native alerts).

import type { TurnstileApi } from '../global';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface ContactApiResponse {
  success: boolean;
  error?: string;
}

interface PublicConfigResponse {
  turnstileSitekey: string;
}

type StatusKind = 'info' | 'success' | 'error';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

async function playRocketSequence(
  rocket: HTMLElement,
  btn: HTMLButtonElement | null,
  form: HTMLElement,
) {
  const rocketContent = document.querySelector("[data-rocket-content]");
  if (!rocketContent) return;

  // Phase 1: Rise from behind the form (1.2s)
  rocket.style.opacity = "1";
  rocket.style.transition = "transform 1.2s cubic-bezier(0.16,1,0.3,1), opacity 0.1s ease";
  rocket.style.transform = "translateX(-50%) translateY(150%)";
  await sleep(1200);

  // Phase 2: Start curved flight path (2.5s)
  rocket.style.transition = "none";
  rocket.classList.add("rocket-flying");
  await sleep(2500);

  // Phase 3: Show flame and ignite (0.2s buffer then 3s vibration)
  const flame = rocket.querySelector("#rocket-flame") as HTMLElement | null;
  if (flame) flame.style.display = "block";
  await sleep(200);
  rocketContent.classList.add("vibrating");
  await sleep(3000);

  // Phase 4: Take off (rocket-exit animation)
  rocketContent.classList.remove("vibrating");
  rocket.classList.remove("rocket-flying");
  rocket.classList.add("rocket-exit");

  if (btn) {
    btn.textContent = "¡Mensaje enviado!";
    btn.classList.add("bg-green-600", "text-white");
    btn.classList.remove("bg-zinc-100", "text-zinc-900");
  }
  await sleep(1000);

  // Phase 5: Reset everything for next use
  (form as HTMLFormElement).reset();

  if (btn) {
    btn.disabled = true;
    btn.textContent = "Completa el captcha para enviar";
    btn.classList.remove(
      "bg-green-600",
      "text-white",
      "cursor-not-allowed",
      "opacity-70",
      "hover:bg-zinc-200",
      "hover:scale-[1.02]",
      "active:scale-[0.98]",
    );
    btn.classList.add("bg-zinc-100", "text-zinc-900", "opacity-50", "cursor-not-allowed");
  }

  rocket.classList.remove("rocket-exit");
  rocket.style.opacity = "0";
  rocket.style.transition = "none";
  rocket.style.transform = "translateX(-50%) translateY(0%)";
  if (flame) flame.style.display = "none";
}

async function waitForTurnstile(timeoutMs = 10000): Promise<TurnstileApi | null> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (window.turnstile) return window.turnstile;
    await sleep(100);
  }
  return null;
}

async function resolveSitekey(form: HTMLElement): Promise<string> {
  const fromForm = form.getAttribute("data-turnstile-sitekey")?.trim();
  if (fromForm) return fromForm;

  try {
    const response = await fetch("/api/config");
    if (!response.ok) return "";
    const data = (await response.json()) as PublicConfigResponse;
    return data.turnstileSitekey?.trim() ?? "";
  } catch {
    return "";
  }
}

export function initContactForm() {
  const contactForm = document.querySelector("[data-contact-form]") as HTMLFormElement | null;
  const submitBtn = document.querySelector("[data-submit-btn]") as HTMLButtonElement | null;
  const statusEl = document.querySelector("[data-contact-status]") as HTMLElement | null;
  const widgetEl = document.querySelector(".cf-turnstile") as HTMLElement | null;
  if (!contactForm || !submitBtn || !widgetEl) return;

  let widgetId: string | null = null;

  const setStatus = (kind: StatusKind, message: string) => {
    if (!statusEl) return;
    statusEl.dataset.kind = kind;
    statusEl.textContent = message;
  };

  const setSubmitEnabled = (enabled: boolean, label = "Enviar mensaje") => {
    submitBtn.disabled = !enabled;
    submitBtn.textContent = label;
    submitBtn.classList.toggle("opacity-50", !enabled);
    submitBtn.classList.toggle("cursor-not-allowed", !enabled);
  };

  const resetCaptcha = () => {
    if (window.turnstile && widgetId) {
      window.turnstile.reset(widgetId);
    }
    setSubmitEnabled(false, "Completa el captcha para enviar");
  };

  (async () => {
    const turnstile = await waitForTurnstile();
    if (!turnstile) {
      setStatus('error', "No se pudo cargar la verificación de seguridad. Recarga la página.");
      return;
    }

    const sitekey = await resolveSitekey(contactForm);
    if (!sitekey) {
      setStatus('error', "La verificación de seguridad no está configurada.");
      return;
    }

    widgetId = turnstile.render(widgetEl, {
      sitekey,
      theme: "dark",
      callback: () => {
        setSubmitEnabled(true);
        setStatus('info', "");
      },
      "error-callback": () => {
        setSubmitEnabled(false, "Captcha inválido");
        setStatus('error', "La verificación falló. Inténtalo de nuevo.");
      },
      "expired-callback": () => {
        setSubmitEnabled(false, "Completa el captcha nuevamente");
        setStatus('error', "La verificación expiró. Complétala de nuevo.");
      },
    });
  })();

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    submitBtn.disabled = true;
    submitBtn.textContent = "Validando...";
    submitBtn.classList.remove("hover:bg-zinc-200", "hover:scale-[1.02]", "active:scale-[0.98]");
    submitBtn.classList.add("cursor-not-allowed", "opacity-70");
    setStatus('info', "");

    try {
      const token = (widgetId && window.turnstile?.getResponse(widgetId)) ||
        (document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement | null)?.value;

      if (!token) {
        setStatus('error', "Por favor completa la verificación de seguridad.");
        setSubmitEnabled(false, "Completa el captcha para enviar");
        return;
      }

      const formData = new FormData(contactForm);
      const name = String(formData.get("name") ?? "");
      const email = String(formData.get("email") ?? "");
      const message = String(formData.get("message") ?? "");

      submitBtn.textContent = "Enviando mensaje...";

      // Turnstile se valida en el servidor, que envía el correo por su cuenta
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, turnstileToken: token }),
      });

      const data = (await response.json()) as ContactApiResponse;
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Error en la validación de seguridad");
      }

      setStatus('success', "¡Mensaje enviado! Gracias por escribirme.");

      const rocket = document.querySelector("[data-rocket]") as HTMLElement | null;
      if (rocket && !prefersReducedMotion()) {
        await playRocketSequence(rocket, submitBtn, contactForm);
      } else {
        contactForm.reset();
        submitBtn.textContent = "¡Mensaje enviado!";
        submitBtn.classList.add("bg-green-600", "text-white");
        submitBtn.classList.remove("bg-zinc-100", "text-zinc-900");
        await sleep(2500);
        submitBtn.classList.remove("bg-green-600", "text-white");
        submitBtn.classList.add("bg-zinc-100", "text-zinc-900");
      }

      resetCaptcha();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al enviar el mensaje";
      setStatus('error', message);
      submitBtn.disabled = true;
      submitBtn.textContent = "Completa el captcha para enviar";
      if (window.turnstile && widgetId) window.turnstile.reset(widgetId);
    } finally {
      submitBtn.classList.remove("cursor-not-allowed", "opacity-70");
    }
  });

  // ─── COPY EMAIL TO CLIPBOARD ─────────────────────────────────────────
  document.querySelectorAll("[data-copy-email]").forEach((copyBtn) => {
    copyBtn.addEventListener("click", () => {
      const email = "francisco@zobercito.dev";
      navigator.clipboard.writeText(email);
      const label = copyBtn.querySelector("[data-copy-label]");
      if (label) {
        const original = label.textContent;
        label.textContent = "¡Copiado!";
        setTimeout(() => (label.textContent = original), 2000);
      }
    });
  });
}
