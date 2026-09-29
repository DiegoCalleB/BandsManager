---
name: clean-code-discipline
description: Reglas de concisión extrema, prevención de sobre-ingeniería (anti-bloat), reutilización de utilidades nativas y existentes de BandManager.io, y cero deuda técnica de TypeScript. Usar al escribir nuevo código o refactorizar lógica existente.
---

# ✂️ Skill: Clean Code & Anti-Bloat Discipline (Principios Ponytail)

Esta skill establece las directrices de concisión, reutilización radical y diseño minimalista de código para mantener la base de código de **BandManager.io** ligera, rápida y libre de abstracciones prematuras.

---

## 🎯 1. Principios Fundamentales de Concisión

1. **Reutilizar antes de crear (Rule of Zero Duplication):**
   * Antes de escribir un helper de formato, fechas o cálculo, verifica `server/utils/*.ts` y `src/utils/*.ts`.
   * Ejemplos existentes: `formatSongTitle.ts`, `bandHash.ts`, `planLimits.ts`, `musicTheory.ts`, `escapeHtml.ts`.
2. **Priorizar APIs Nativas:**
   * Utiliza métodos nativos de ES2022+ (`Array.prototype.findLast`, `Object.hasOwn`, `structuredClone`, `URL`, `crypto.randomUUID()`) en lugar de instalar o inventar utilidades externas.
3. **No Over-Engineering (KISS & YAGNI):**
   * Escribe la implementación más simple y directa que cumpla con los requisitos.
   * Evita patrones de fábrica ("Factory"), adaptadores o capas de indirección si una simple función pura resuelve el problema.
4. **Cero Líneas Muertas o Código Especulativo:**
   * No añadas parámetros opcionales "por si en el futuro se necesitan".
   * No dejes bloques de código comentado o `console.log` de debug en commits finales.

---

## 🧩 2. Patrones de Código Limpio en BandManager.io

### Frontend (React 19 & Tailwind CSS v4)
* **Estilos declarativos:** Usa clases Tailwind v4 directas en `className`. Evita objetos de estilo inline (`style={{...}}`) o CSS modules innecesarios.
* **Componentes enfocados:** Un componente debe tener una responsabilidad clara. Si supera las 250 líneas, extrae subcomponentes o hooks de lógica específicos (`src/hooks/`).
* **Manejo de estado:** Prefiere `useState` y `useMemo` locales para datos efímeros y hooks dedicados (`useAppData`, `useBookingPipeline`) para datos globales compartidos.

### Backend (Express & Supabase)
* **Handlers concisos:** Mantén los controladores de rutas (`server/routes/`) enfocados en:
  1. Autenticación y resolución de banda (`getTargetBandId(req)`).
  2. Validación de entrada mínima y límites de plan (`checkRecordLimit`).
  3. Delegación a la capa de base de datos (`server/db/*.ts`).
  4. Respuesta JSON limpia.
* **Cero mutaciones directas sin tipado:** Toda función de base de datos debe declarar explícitamente sus tipos de entrada y retorno basados en `src/types.ts`.

---

## 🛡️ 3. Disciplina TypeScript

* **No `any` arbitrarios:** Usa tipos precisos o genéricos acotados.
* **Tipos derivados:** Utiliza `Pick`, `Omit`, `Partial` o `Extract` sobre los tipos base de `src/types.ts` en lugar de redefinir interfaces duplicadas.
* **Validación en Build:** Todo cambio debe superar `npm run typecheck` (`tsc --noEmit`) sin introducir nuevos errores de tipo.

---

## ✅ Checklist de Concisión y Calidad

- [ ] ¿Se reutilizaron utilidades existentes de `src/utils/` o `server/utils/` en lugar de duplicar lógica?
- [ ] ¿El código nuevo prescinde de abstracciones prematuras o capas intermedias innecesarias?
- [ ] ¿Se evitaron estilos inline y librerías externas redundantes?
- [ ] ¿El diff es conciso, legible y enfocado estrictamente en la tarea requerida?
- [ ] ¿Se superó la verificación de tipos (`npm run typecheck` / `compile_applet`)?
