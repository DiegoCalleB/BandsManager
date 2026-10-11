---
id: src_utils_saveErrors
title: "src/utils/saveErrors.ts"
layer: service
domain: system
file: "src/utils/saveErrors.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/saveErrors.ts

> **Ubicación:** `src/utils/saveErrors.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: SAVE_ERROR_EVENT, SaveErrorDetail, debeAvisar, instalarAvisoDeGuardados.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_SaveErrorBanner|src/components/SaveErrorBanner.tsx]] *(from #frontend)*
- [[src_main|src/main.tsx]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/saveErrors.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
