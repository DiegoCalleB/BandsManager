---
id: src_components_band_switcher_hooks_useCreateBand
title: "src/components/band_switcher/hooks/useCreateBand.ts"
layer: frontend
domain: system
file: "src/components/band_switcher/hooks/useCreateBand.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/band_switcher/hooks/useCreateBand.ts

> **Ubicación:** `src/components/band_switcher/hooks/useCreateBand.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Flujo de dos pasos para crear una banda nueva con su plan.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_band_switcher_bandSwitcherConfig|src/components/band_switcher/bandSwitcherConfig.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorMessage|src/utils/errorMessage.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_band_switcher_hooks_useBandSwitcherController|src/components/band_switcher/hooks/useBandSwitcherController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
