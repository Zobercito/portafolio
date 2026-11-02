# Accesibilidad — auditoría WCAG 2.2 AA

Informe de la auditoría automatizada (axe-core 4.x, tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) ejecutada sobre la app en desarrollo con Playwright/Chromium a 1440×900, y checklist de regresión para cambios futuros.

Fecha de la última corrida: 2026-11-01. Resultado: **0 violaciones AA** en todos los estados auditados.

## Estados auditados

| Estado | Resultado |
| --- | --- |
| Landing / hero (tras hidratación) | Sin violaciones AA |
| Sobre mí + MiniChat (island visible) | Sin violaciones AA |
| Experiencia (tarjetas y «Ver más») | Sin violaciones AA |
| Modal de Proyectos (grid) | Sin violaciones AA |
| Lightbox de detalle (video + skills) | Sin violaciones AA |
| Contacto (formulario + widget Turnstile) | Sin violaciones AA |

## Corregido en esta auditoría

- `ChatHeader.tsx`: el botón del selector de modelo usaba `aria-label="Seleccionar modelo de IA"` mientras el texto visible era el nombre del modelo (violación `label-content-name-mismatch`). Ahora el `aria-label` incluye la etiqueta visible: `Cambiar modelo de IA: {modelo}`.
- `ModalDetail.tsx`: el encabezado «Tecnologías utilizadas» usaba `text-zinc-500` sobre fondo oscuro (contraste ~3.4:1, violación `color-contrast`). Cambiado a `text-zinc-400` (~7:1).

## Excepciones conocidas (no bloqueantes)

- **13 nodos `color-contrast` "incompletos"** en la landing: texto sobre el canvas animado de fondo (`spaceCanvas`). axe no puede resolver el color de fondo de un canvas. Verificación manual: los primeros planos usan escalas zinc-300/zinc-400+ sobre `#09090b`, todas ≥ 7:1 → cumplen AA.
- **Iframe de Turnstile**: origen cruzado, axe no lo inspecciona. El widget lo provee Cloudflare y se deja tal cual.
- El slider de secciones traduce el contenido fuera de pantalla en vez de ocultarlo: los lectores de pantalla reciben todo el documento de una. Decisión de diseño pendiente de revisión en D11 (navegación slider vs scroll nativo).

## Pendiente de validación humana

La auditoría automatizada no cubre navegación con lector de pantalla real. Falta una pasada manual con NVDA/VoiceOver sobre: modal (entrada/salida y foco), chat (anuncios `aria-live` de respuestas) y formulario de contacto (lectura del `role="status"`).

## Checklist de regresión (para PRs)

Correr axe sobre los seis estados de la tabla anterior con `axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa'] } })` y verificar:

- [ ] 0 violaciones AA en cada estado.
- [ ] Diálogos: foco inicial dentro del modal, foco atrapado con Tab/Shift+Tab, Escape los cierra y devuelve el foco al disparador.
- [ ] Todo botón interactivo sin texto visible tiene `aria-label` que contiene su texto visible.
- [ ] Imágenes y video con `width`/`height` definidos y `alt`/`aria-label` descriptivo.
- [ ] Nada nuevo depende de animación: con `prefers-reduced-motion: reduce` todo el contenido es alcanzable y visible.
- [ ] Los mensajes de estado (chat, formulario) se publican en nodos `role="status"` / `aria-live="polite"`.
- [ ] Contraste de texto nuevo ≥ 4.5:1 (≥ 3:1 para texto grande); no usar zinc-500 o más oscuro como primer plano sobre fondos zinc-900/950.

Integración continua: se automatizará junto con el E2E de Playwright en el ítem D5 (aún no incorporado al workflow de CI).
