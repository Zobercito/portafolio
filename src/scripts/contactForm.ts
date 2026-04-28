// ─── CONTACT FORM + ROCKET ANIMATION ────────────────────────────────────
// Handles Turnstile captcha rendering, form submission, and the 5-phase
// rocket launch sequence. The callback hell has been replaced with async/await.


// Utility to pause async sequences without nested setTimeout pyramids
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

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

  if (window.turnstile) window.turnstile.reset();
}

export function initContactForm() {
  const contactForm = document.querySelector("[data-contact-form]") as HTMLElement | null;
  const submitBtn = document.querySelector("[data-submit-btn]") as HTMLButtonElement | null;
  const turnstileSitekey = contactForm?.getAttribute("data-turnstile-sitekey");

  // Make it global so Cloudflare Turnstile can find it via ?onload=...
  window.onloadTurnstileCallback = function () {
    if (submitBtn && window.turnstile && turnstileSitekey) {
      window.turnstile.render(".cf-turnstile", {
        sitekey: turnstileSitekey,
        theme: "dark",
        callback: () => {
          // Captcha passed: enable submit
          submitBtn.disabled = false;
          submitBtn.textContent = "Enviar mensaje";
          submitBtn.classList.remove("opacity-50", "cursor-not-allowed", "disabled:hover:scale-100");
        },
        "error-callback": () => {
          // Captcha failed
          submitBtn.disabled = true;
          submitBtn.textContent = "Captcha inválido";
          submitBtn.classList.add("opacity-50", "cursor-not-allowed");
        },
        "expired-callback": () => {
          // Captcha token expired
          submitBtn.disabled = true;
          submitBtn.textContent = "Completa el captcha nuevamente";
          submitBtn.classList.add("opacity-50", "cursor-not-allowed");
        },
      });
    }
  };

  if (!contactForm) return;

  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const btn = document.querySelector("[data-submit-btn]") as HTMLButtonElement | null;

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Validando...";
      btn.classList.remove("hover:bg-zinc-200", "hover:scale-[1.02]", "active:scale-[0.98]");
      btn.classList.add("cursor-not-allowed", "opacity-70");
    }

    try {
      // Retrieve Turnstile token from the hidden input
      const turnstileRes = document.querySelector(
        '[name="cf-turnstile-response"]',
      ) as HTMLInputElement | null;
      const turnstileToken = turnstileRes?.value;

      if (!turnstileToken) {
        alert("Por favor completa la verificación de seguridad");
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Enviar mensaje";
          btn.classList.remove("cursor-not-allowed", "opacity-70");
          btn.classList.add("hover:bg-zinc-200", "hover:scale-[1.02]", "active:scale-[0.98]");
        }
        return;
      }

      const formData = new FormData(contactForm as HTMLFormElement);
      const name = formData.get("name");
      const email = formData.get("email");
      const message = formData.get("message");

      if (btn) btn.textContent = "Enviando mensaje...";

      // Verify Turnstile server-side and get the Web3Forms access key
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, turnstileToken }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Error en la validación de seguridad");
      }

      // Send directly from the browser — Web3Forms rejects Node.js backend calls
      const web3formsResponse = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: data.accessKey,
          name,
          email,
          message,
          from_name: "Portafolio Contact Form",
          subject: `Nuevo mensaje de ${name} desde Portafolio`,
        }),
      });

      const web3Result = await web3formsResponse.json();
      if (!web3formsResponse.ok || !web3Result.success) {
        throw new Error(web3Result.message || "Error al enviar el mensaje");
      }

      // Everything succeeded — launch the rocket
      const rocket = document.querySelector("[data-rocket]") as HTMLElement | null;
      if (rocket) {
        playRocketSequence(rocket, btn, contactForm);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Enviar mensaje";
        btn.classList.remove("cursor-not-allowed", "opacity-70");
        btn.classList.add("hover:bg-zinc-200", "hover:scale-[1.02]", "active:scale-[0.98]");
      }
      if (window.turnstile) window.turnstile.reset();
    }
  });

  // ─── COPY EMAIL TO CLIPBOARD ─────────────────────────────────────────
  document.querySelectorAll("[data-copy-email]").forEach((copyBtn) => {
    copyBtn.addEventListener("click", () => {
      const email = "francisco@zobercito.dev";
      navigator.clipboard.writeText(email);
      const label = copyBtn.querySelector("[data-copy-label]");
      if (label) {
        const original = label.innerHTML;
        label.innerHTML = "¡Copiado!";
        setTimeout(() => (label.innerHTML = original), 2000);
      }
    });
  });
}
