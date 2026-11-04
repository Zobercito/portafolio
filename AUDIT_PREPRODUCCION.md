# 🚨 AUDITORÍA PRE-PRODUCCIÓN - PROBLEMAS ENCONTRADOS

**Fecha:** 4 de Noviembre de 2026  
**Status:** ⚠️ CRÍTICOS Y ALTOS ENCONTRADOS

---

## 🔴 PROBLEMAS CRÍTICOS

### 1. **Console.log en Producción (Web Vitals)**

**Archivo:** `src/utils/vitals.ts`  
**Severidad:** 🔴 CRÍTICA  
**Problema:** Múltiples `console.log()` enviando datos a browser console  
**Riesgo:** Revela información de performance (INP, LCP, TTFB) públicamente  
**Líneas:** múltiples (`console.log('CLS:', ...)`, etc)

**Fix:**

```diff
- console.log('CLS:', metric.value);
+ if (import.meta.env.DEV) console.log('CLS:', metric.value);
```

### 2. **Console.log en contactMail/APIs**

**Archivo:** `src/pages/api/contact.ts`  
**Severidad:** 🔴 CRÍTICA  
**Problema:** `console.error()` sin filtro en APIs  
**Riesgo:** Logs de producción exponiendo errores  
**Fix:** Solo en DEV o enviar a Sentry

---

## 🟠 PROBLEMAS ALTOS

### 3. **Falta Timeout en Requests HTTP**

**Archivo:** `src/utils/turnstile.ts`, `src/utils/contactMail.ts`  
**Severidad:** 🟠 ALTA  
**Problema:** `fetch()` sin timeout configurado  
**Riesgo:** Request colgada indefinidamente = DDoS interno  
**Impacto:** Si Cloudflare Turnstile o Resend se cuelgan, el servidor espera infinito

**Ubicación específica:**

```typescript
// src/utils/turnstile.ts línea ~40
const response = await fetch(
  'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  { method: 'POST', body: JSON.stringify(...) }
  // ❌ SIN timeout
);
```

**Fix:** Agregar AbortController con timeout de 5s

### 4. **readEnvValue() sin validación en APIs críticas**

**Archivo:** `src/pages/api/contact.ts`, `src/pages/api/chat.ts`  
**Severidad:** 🟠 ALTA  
**Problema:** Si variable de entorno no existe, devuelve `undefined`  
**Riesgo:** API funciona pero falla silenciosamente en producción  
**Ejemplo:**

```typescript
const turnstileSecretKey = readEnvValue('TURNSTILE_SECRET_KEY');
// Si no existe → undefined → validación falla silenciosamente
```

### 5. **Web Vitals tracking sin error handling**

**Archivo:** `src/utils/vitals.ts`  
**Severidad:** 🟠 ALTA  
**Problema:** Si el endpoint `/api/analytics` falla, no hay retry  
**Riesgo:** Métricas perdidas  
**Fix:** Implementar retry con exponential backoff

---

## 🟡 PROBLEMAS MEDIOS

### 6. **Variables de entorno faltantes en .env.example**

**Archivo:** `.env.example`  
**Severidad:** 🟡 MEDIA  
**Problema:** `import.meta.env.GROQ_API_KEY` no está documentado en .env.example  
**Fix:** Agregar a .env.example

### 7. **SENTRY_DSN con console.warn sin verificación**

**Archivo:** `src/utils/sentry.ts`  
**Severidad:** 🟡 MEDIA  
**Problema:** Console.warn expone que Sentry no está configurado  
**Fix:** Solo avisar en DEV

### 8. **URLs hardcodeadas (OK pero revisar)**

**Archivo:** Múltiples  
**Severidad:** 🟢 BAJA (OK, son Cloudflare oficiales)

- `https://challenges.cloudflare.com/turnstile/v0/api.js`
- `https://static.cloudflareinsights.com`
- `https://cloudflareinsights.com`

---

## ✅ CHECKLIST DE FIXES

- [ ] Remover/condicionar console.log en `src/utils/vitals.ts`
- [ ] Agregar timeout (5s) a fetch en `src/utils/turnstile.ts`
- [ ] Agregar timeout (10s) a fetch en `src/utils/contactMail.ts`
- [ ] Validar variables criticas en APIs (throw si undefined)
- [ ] Condicionar console.warn/error a DEV mode
- [ ] Actualizar .env.example con todas las variables
- [ ] Tests E2E: verificar que APIs fallan correctamente sin credentials

---

## 🎯 RECOMENDACIONES

1. **Inmediato (ANTES de producción):**
   - [ ] Fijar todos los console.log
   - [ ] Agregar timeouts
   - [ ] Validar env vars

2. **Corto plazo (1-2 días):**
   - [ ] Implementar retry logic para Web Vitals
   - [ ] Mejorar error handling en APIs
   - [ ] Agregar tests de error paths

3. **Largo plazo:**
   - [ ] Implementar health checks
   - [ ] Monitoring de request latency
   - [ ] Rate limiting por IP

---

**Status Actual:** ⚠️ **NO LISTO PARA PRODUCCIÓN**  
**Bloqueadores:** 5 (console.log, timeouts, env validation)  
**Tiempo estimado de fix:** 30 minutos
