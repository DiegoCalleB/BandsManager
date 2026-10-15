---
id: src_components_band_switcher_hooks_useBandSwitcherController
title: "src/components/band_switcher/hooks/useBandSwitcherController.ts"
layer: frontend
domain: system
file: "src/components/band_switcher/hooks/useBandSwitcherController.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/band_switcher/hooks/useBandSwitcherController.ts

> **Ubicación:** `src/components/band_switcher/hooks/useBandSwitcherController.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Controlador del selector de bandas: estado, lista, orden, creación y acciones.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_band_switcher_bandSwitcherTypes|src/components/band_switcher/bandSwitcherTypes.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_band_switcher_hooks_useBandActions|src/components/band_switcher/hooks/useBandActions.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_band_switcher_hooks_useBandList|src/components/band_switcher/hooks/useBandList.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_band_switcher_hooks_useBandOrdering|src/components/band_switcher/hooks/useBandOrdering.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_band_switcher_hooks_useBandReorder|src/components/band_switcher/hooks/useBandReorder.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_band_switcher_hooks_useCreateBand|src/components/band_switcher/hooks/useCreateBand.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_bandUtils|src/utils/bandUtils.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_band_switcher_BandSwitcherContext|src/components/band_switcher/BandSwitcherContext.ts]] *(from #frontend)*
- [[src_components_BandSwitcherModal|src/components/BandSwitcherModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
