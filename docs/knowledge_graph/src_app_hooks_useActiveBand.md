---
id: src_app_hooks_useActiveBand
title: "src/app/hooks/useActiveBand.ts"
layer: service
domain: system
file: "src/app/hooks/useActiveBand.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/app/hooks/useActiveBand.ts

> **Ubicación:** `src/app/hooks/useActiveBand.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Banda activa del usuario: id, nombre, logo, plan y comparación de ids.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_band_switcher_bandSwitcherTypes|src/components/band_switcher/bandSwitcherTypes.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_planPermissions|src/utils/planPermissions.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_userPreferences|src/utils/userPreferences.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_hooks_useAppController|src/app/hooks/useAppController.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
