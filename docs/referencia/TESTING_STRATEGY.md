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
  ```
* **Flujos cubiertos:**
  1. `health.spec.ts`: Healthcheck de despliegue en Railway (`/api/health`).
  2. `auth.spec.ts`: Login real contra usuario semilla sin mocks.
  3. `epk-public.spec.ts`: Disponibilidad del dossier público de banda.
  4. `onboarding-journey.spec.ts`: Registro completo y asistente inicial multi-paso con banda temporal aislada.
  5. `setlist-impreso.spec.ts`: Verificación de invariantes en maquetación de repertorio (paginación, legibilidad y notas).
  6. `dashboard-tirador.spec.ts`, `setlist-ajustes.spec.ts`, `setlist-mis-dudas.spec.ts` y `superficies-publicas.spec.ts`: redimensionado del Dashboard, ajustes y dudas del setlist, y robots/sitemap/enlaces cortos/404.
  Regresión visual: no hay (se quitó el proyecto `visual`; si vuelve, que lleve capturas guardadas y un comando que funcione).
* **Sesión:** las pruebas que la necesitan inician sesión por la interfaz con un usuario semilla (`diego`); no hay `storageState` compartido, así que cada una hace su login y conviene no abusar de ellas por el `loginRateLimiter` del backend.
* **Selectores Estables:** Localizar elementos por accesibilidad (`getByRole`, `getByPlaceholder` o texto visible), nunca por clases dinámicas de Tailwind.
