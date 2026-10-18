---
id: src_utils_analitica
title: "src/utils/analitica.ts"
layer: service
domain: system
file: "src/utils/analitica.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/analitica.ts

> **Ubicación:** `src/utils/analitica.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Analítica web con Plausible: sin cookies, sin datos personales, sin banner de consentimiento.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_fans_landing_hooks_useFanSignupSubmit|src/components/fans_landing/hooks/useFanSignupSubmit.ts]] *(from #frontend)*
- [[src_components_landing_FormularioInteres|src/components/landing/FormularioInteres.tsx]] *(from #frontend)*
- [[src_components_login_registrarCuenta|src/components/login/registrarCuenta.ts]] *(from #frontend)*
- [[src_components_PublicLanding|src/components/PublicLanding.tsx]] *(from #frontend)*
- [[src_main|src/main.tsx]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/analitica.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
