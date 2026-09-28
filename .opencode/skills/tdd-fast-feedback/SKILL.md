---
name: tdd-fast-feedback
description: Fast feedback TDD workflow and anti-regression engine for Claude Code, Open Code, Cursor, and Gemini. Uses Vitest and Playwright with <1.5s validation loops.
---

# ⚡ Skill: TDD Fast Feedback & Anti-Regression Guardian (Universal Agent Standard)

Estándar de desarrollo dirigido por pruebas (*Test-Driven Development*) ultra-rápido para asegurar que ningún agente introduzca regresiones en la base de código.

---

## 🔁 1. El Ciclo de 3 Pasos

1. 🔴 **Red:** Escribe o adapta el test en Vitest (`npx vitest run ...`) que capture la funcionalidad esperada.
2. 🟢 **Green:** Implementa el código mínimo necesario para que el test pase.
3. 🔵 **Refactor & Fast Check:** Ejecuta `npm run check:fast` para verificar tipos y seguridad en menos de 1.5 segundos.

---

## 🚦 Comandos de Verificación Rápida

- `npm run check:fast` ➔ Typecheck + Tests de seguridad (`bandIdTrustBoundary.test.ts`).
- `npm run test:fast` ➔ Ejecución de suite de tests unitarios.
- `npm run test:e2e` ➔ Suite completa de Playwright E2E.
