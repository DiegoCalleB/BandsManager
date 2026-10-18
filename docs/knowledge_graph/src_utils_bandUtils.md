---
id: src_utils_bandUtils
title: "src/utils/bandUtils.ts"
layer: service
domain: system
file: "src/utils/bandUtils.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/bandUtils.ts

> **Ubicación:** `src/utils/bandUtils.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Normaliza un band_id para comparar (quita el prefijo band-/reg-). Antes, un bandId vacío

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_band_switcher_BandCardsGrid|src/components/band_switcher/BandCardsGrid.tsx]] *(from #frontend)*
- [[src_components_band_switcher_BandSettingsModal|src/components/band_switcher/BandSettingsModal.tsx]] *(from #frontend)*
- [[src_components_band_switcher_hooks_useBandActions|src/components/band_switcher/hooks/useBandActions.ts]] *(from #frontend)*
- [[src_components_band_switcher_hooks_useBandList|src/components/band_switcher/hooks/useBandList.ts]] *(from #frontend)*
- [[src_components_band_switcher_hooks_useBandReorder|src/components/band_switcher/hooks/useBandReorder.ts]] *(from #frontend)*
- [[src_components_band_switcher_hooks_useBandSwitcherController|src/components/band_switcher/hooks/useBandSwitcherController.ts]] *(from #frontend)*
- [[src_components_band_switcher_UpgradePlanModal|src/components/band_switcher/UpgradePlanModal.tsx]] *(from #frontend)*
- [[src_components_Dashboard|src/components/Dashboard.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
