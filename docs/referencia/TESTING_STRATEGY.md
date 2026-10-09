# Estrategia de Testing — BandManager.io

Guía detallada de pruebas unitarias, de integración y E2E para el proyecto. Documento de referencia técnica bajo demanda.

---

## 1. Tests Unitarios e Integración Ligera (Vitest)

* **Ubicación:** Carpetas `__tests__/` adyacentes al código que prueban (ej: `server/utils/__tests__/bandAccess.test.ts`, `src/utils/__tests__/duplicateLeads.test.ts`).
* **Estrategia:** Pruebas directas de funciones puras exportadas contra objetos `req` o datos falsos, sin necesidad de levantar el servidor HTTP completo.
* **Comandos:**
  ```bash
  npm test                          # Ejecuta la suite completa de Vitest
  npx vitest run ruta/al/test.ts   # Ejecuta un test específico
  npx vitest                        # Modo interactivo (watch)
  npm run test:coverage            # Reporte de cobertura
  ```
* **TDD Obligatorio en Áreas Críticas:**
  * En **aislamiento multi-banda (`band_id`)** y **dinero/facturación (Stripe, ledger de IA `aiLedger.ts`)**, el test del caso límite se escribe **antes** de tocar el código de implementación.
  * Los tests deben verificar invariantes (ej. "ninguna consulta devuelve datos de otro `band_id`", "el saldo nunca queda negativo sin registrar transacción").

---

## 2. Tests End-to-End (Playwright) — Smoke Suite & Journeys

* **Filosofía:** Enfoque en pruebas de humo (*smoke*) y flujos esenciales (*journeys*) para evitar fragilidad ante rediseños visuales frecuentes.
* **Comando:**
  ```bash
  npm run test:e2e                 # Ejecuta suite E2E en local
  npm run test:visual              # Compara regresión visual de pantallas
  npm run test:visual:update       # Regenera capturas de referencia visual
  ```
* **Flujos cubiertos:**
  1. `health.spec.ts`: Healthcheck de despliegue en Railway (`/api/health`).
  2. `auth.spec.ts`: Login real contra usuario semilla sin mocks.
  3. `epk-public.spec.ts`: Disponibilidad del dossier público de banda.
  4. `onboarding-journey.spec.ts`: Registro completo y asistente inicial multi-paso con banda temporal aislada.
  5. `setlist-impreso.spec.ts`: Verificación de invariantes en maquetación de repertorio (paginación, legibilidad y notas).
  6. `visual.spec.ts`: Regresión visual en resoluciones de escritorio (1280×800) y móvil (390×844).
* **Autenticación Reutilizable:** Las pruebas que requieren sesión usan `storageState` (`e2e/auth.setup.ts`) para realizar un único login por corrida y respetar el `loginRateLimiter` del backend.
* **Selectores Estables:** Localizar elementos por accesibilidad (`getByRole`, `getByPlaceholder` o texto visible), nunca por clases dinámicas de Tailwind.
