# 🐛 REPORTE: Micro-stuttering en Primer Scroll

**Fecha:** 4 de Noviembre de 2026  
**Severidad:** 🟡 MEDIA (UX degradada, no bloqueante)  
**Reproducción:** 100% en primer scroll, desaparece en scrolls subsecuentes

---

## 📋 SÍNTOMAS

**Comportamiento observado:**

- Al hacer scroll de Hero → About → Experience (primera vez)
- Se notan micro-trabones, lagasos, micro-cortes
- El scroll NO es fluido (jank visible)
- En scrolls subsecuentes (volver a subir/bajar), el jank desaparece

---

## 🔍 DIAGNÓSTICO: 5 CAUSAS IDENTIFICADAS

### 🔴 **CAUSA #1: Canvas corriendo durante transición de scroll (PRINCIPAL)**

**Problema:**

```typescript
// spaceCanvas.ts ejecuta esto cada frame (~30fps)
function drawFrame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Full canvas clear
  // Dibuja 100 estrellas + shooting stars con gradientes
  stars.forEach((star) => {
    /* draw */
  });
  requestAnimationFrame(drawFrame); // Loop infinito
}
```

**Durante el scroll:**

- slideEngine.ts hace `transform: translateY()` (800ms de animación CSS)
- spaceCanvas.ts sigue ejecutando `clearRect` + 100 draws + gradientes
- **Ambos compiten por el frame budget del navegador**

**Impacto:** Alto. Canvas no se pausa durante scroll-snap.

---

### 🔴 **CAUSA #2: Hidratación React durante scroll (client:visible)**

**Problema:**

```astro
<!-- About.astro -->
<MiniChat client:visible />  ← Se hidrata cuando entra en viewport

<!-- Experience.astro -->
<ExperienceLayout client:visible />  ← Se hidrata al scrollear
```

**Primera vez que scrolleas:**

1. Usuario scrollea de Hero → About
2. `MiniChat` entra en viewport → React hidrata
3. Main thread ejecuta:
   - Parse del bundle React
   - Mount de componentes
   - `useEffect` hooks
   - `fetch('/api/config')`
   - IntersectionObserver setup

**Subsecuentes:**

- React ya hidratado → sin overhead

**Impacto:** Alto en primer scroll, cero después.

---

### 🟡 **CAUSA #3: Fetch bloqueante al hidratar MiniChat**

**Problema:**

```typescript
// MiniChat.tsx - useEffect on mount
useEffect(() => {
  fetch('/api/config')  ← Bloqueante durante hidratación
    .then(res => res.json())
    .then(setConfig);
}, []);
```

**Timeline del problema:**

1. Usuario scrollea → `MiniChat` entra en viewport
2. React hidrata → `useEffect` ejecuta
3. `fetch('/api/config')` durante scroll animation
4. Main thread espera respuesta mientras anima

**Impacto:** Medio. Network request durante animación.

---

### 🟡 **CAUSA #4: Hooks pesados con IntersectionObserver**

**Problema:**

```typescript
// useCarousel.ts
useEffect(() => {
  const observer = new IntersectionObserver(...);
  // Setup de observers durante scroll
}, []);

// useElementOverflow.ts
useEffect(() => {
  const resizeObserver = new ResizeObserver(...);
  // Medición de overflow durante hidratación
}, []);
```

**Impacto:** Medio. Setup de observers compite con animación.

---

### 🟢 **CAUSA #5: Font swap (menor)**

**Problema:**

```css
/* Inter Variable font */
font-display: swap;  ← Puede causar FOUT
```

Si la font no está en cache, el navegador hace swap durante scroll → reflow.

**Impacto:** Bajo (la font se precarga).

---

## 🎯 SOLUCIONES PROPUESTAS (Prioridad)

### ✅ **FIX #1: Pausar canvas durante scroll-snap (CRÍTICO)**

**Impacto:** Alto | **Esfuerzo:** Bajo

```typescript
// spaceCanvas.ts
let isScrolling = false;

export function pauseCanvas() {
  isScrolling = true;
}

export function resumeCanvas() {
  isScrolling = false;
}

function drawFrame() {
  if (!isScrolling) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach((star) => star.draw());
  }
  requestAnimationFrame(drawFrame);
}

// slideEngine.ts - llamar al cambiar slide
function goToSlide(index: number) {
  pauseCanvas();
  // ... animación ...
  setTimeout(() => resumeCanvas(), ANIM_MS);
}
```

**Resultado esperado:** -70% jank en primer scroll.

---

### ✅ **FIX #2: Cambiar client:visible → client:idle (CRÍTICO)**

**Impacto:** Alto | **Esfuerzo:** Trivial

```diff
<!-- About.astro -->
- <MiniChat client:visible />
+ <MiniChat client:idle />

<!-- Experience.astro -->
- <ExperienceLayout client:visible />
+ <ExperienceLayout client:idle />
```

**Resultado:** React hidrata DESPUÉS del primer scroll, no durante.

---

### ✅ **FIX #3: Lazy-load /api/config solo cuando se interactúa (MEDIO)**

**Impacto:** Medio | **Esfuerzo:** Bajo

```typescript
// MiniChat.tsx
const [configLoaded, setConfigLoaded] = useState(false);

function loadConfig() {
  if (!configLoaded) {
    fetch('/api/config').then(/* ... */);
    setConfigLoaded(true);
  }
}

// Solo fetch cuando el usuario abre el chat
<button onClick={loadConfig}>Abrir chat</button>
```

**Resultado:** Elimina fetch durante scroll inicial.

---

### 🔧 **FIX #4: Reducir estrellas del canvas (OPCIONAL)**

**Impacto:** Bajo | **Esfuerzo:** Trivial

```diff
// spaceCanvas.ts
- const STAR_COUNT = 100;
+ const STAR_COUNT = 50;
```

**Resultado:** -50% draw calls por frame.

---

## 📈 IMPACTO ESPERADO

| Fix              | Jank Reducido | Esfuerzo | Prioridad |
| ---------------- | ------------- | -------- | --------- |
| #1 Pausar canvas | ~70%          | 30min    | 🔴 ALTA   |
| #2 client:idle   | ~20%          | 5min     | 🔴 ALTA   |
| #3 Lazy config   | ~10%          | 15min    | 🟡 MEDIA  |
| #4 Reducir stars | ~5%           | 2min     | 🟢 BAJA   |

**Total esperado:** ~85% reducción de jank en primer scroll.

---

## ✅ PRÓXIMOS PASOS

1. Implementar Fix #1 (pausar canvas)
2. Implementar Fix #2 (client:idle)
3. Testear en producción
4. Medir con Lighthouse (Performance score)
5. Opcional: Fix #3 y #4

---

## 📝 NOTAS TÉCNICAS

- **Por qué funciona en scrolls subsecuentes:**
  - React ya está hidratado
  - Observers ya configurados
  - Solo queda: canvas + CSS transform

- **Por qué el canvas es el culpable principal:**
  - 100 estrellas × 30fps = 3000 draw calls/s
  - `clearRect` de canvas completo cada frame
  - Gradientes lineales por shooting star
  - No hay pausas durante animaciones

- **Performance profile recomendado:**
  - Chrome DevTools → Performance tab
  - Record durante primer scroll
  - Verificar: "Long Tasks" > 50ms
  - Esperado: canvas draw + React hydration
