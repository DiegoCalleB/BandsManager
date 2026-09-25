---
name: tdd-regression-guardian
description: Marco de Test-Driven Development (TDD) estricto y prevención de regresiones para BandManager.io. Aplica ciclo Red-Green-Refactor con Vitest y Playwright E2E antes de alterar lógica crítica.
---

# 🛡️ Skill: TDD & Regression Guardian

Esta skill establece el estándar de desarrollo dirigido por pruebas (*Test-Driven Development*) y blindaje contra regresiones en BandManager.io, asegurando que cada cambio cuente con verificación reproducible antes de tocar producción.

---

## 🔁 1. El Ciclo Red-Green-Refactor Agéntico

```
1. 🔴 RED (Prueba Fallida Primero)
   └─ Escribe un test unitario/integración en Vitest que capture la nueva funcionalidad o el bug.
   └─ Ejecuta el test y confirma que FALLA por la razón esperada.

2. 🟢 GREEN (Implementación Mínima)
   └─ Escribe la menor cantidad de código necesario para que el test pase.
   └─ Verifica que el test pasa con éxito.

3. 🔵 REFACTOR (Optimización y Tipado)
   └─ Limpia la implementación aplicando principios Ponytail (cero sobre-ingeniería).
   └─ Ejecuta `npm run typecheck` y la suite de tests completa (`npm test`).
```

---

## 🎯 2. Pirámide de Pruebas de BandManager.io

```
                  ┌────────────────────────┐
                  │    E2E (Playwright)    │ -> e2e/*.spec.ts
                  │ (Flujos Onboarding/CRM)│
                  ├────────────────────────┤
                  │ Integración / Servicios │ -> server/services/__tests__/*
                  │  (AgentEngine, Lector)  │
                  ├────────────────────────┤
                  │    Unitarios (Vitest)  │ -> server/utils/__tests__/*
                  │ (Audio, Trust Boundary)│    src/utils/__tests__/*
                  └────────────────────────┘
```

---

## 🔒 3. Pruebas de Aislamiento de Seguridad Obligatorias

Cualquier cambio que toque acceso a datos de banda (`band_id`) DEBE contar con su test de frontera en `server/db/__tests__/bandIdTrustBoundary.test.ts`.

```typescript
import { describe, it, expect } from 'vitest';
import { getTargetBandId } from '../../utils/bandAccess.js';

describe('Security Trust Boundary Unit Test', () => {
  it('rechaza inyecciones en req.body.band_id si no coincide con la sesión autenticada', () => {
    const fakeReq = {
      user: { id: 'user_1', band_id: 'band_legitima' },
      body: { band_id: 'band_victima_atacada' },
      headers: {}
    } as any;

    const resolvedBandId = getTargetBandId(fakeReq);
    expect(resolvedBandId).toBe('band_legitima');
    expect(resolvedBandId).not.toBe('band_victima_atacada');
  });
});
```

---

## 🚦 4. Comandos de Verificación Invariable

```bash
# 1. Typecheck estricto (cero errores nuevos de TypeScript)
npm run typecheck

# 2. Tests unitarios y de integración de backend
npx vitest run server/

# 3. Tests de utilidades de audio y lógica frontend
npx vitest run src/utils/

# 4. Suite E2E completa
npm run test:e2e
```

---

## ✅ Checklist del Guardián TDD

- [ ] ¿Se escribió el test antes o junto con el código que introduce el cambio?
- [ ] ¿El test cubre los casos borde (*edge cases*) y escenarios de fallo?
- [ ] ¿La suite de tests completa pasa en verde?
- [ ] ¿El tipado de TypeScript se mantiene con cero errores?
