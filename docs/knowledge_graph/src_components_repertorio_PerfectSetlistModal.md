---
id: src_components_repertorio_PerfectSetlistModal
title: "src/components/repertorio/PerfectSetlistModal.tsx"
layer: frontend
domain: repertoire
file: "src/components/repertorio/PerfectSetlistModal.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/PerfectSetlistModal.tsx

> **Ubicación:** `src/components/repertorio/PerfectSetlistModal.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: SetlistFeedbackInput, PerfectSetlistActionType, PerfectSetlistAction, PerfectSetlistPlan, PerfectSetlistModal.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_common_ModalPortal|src/components/common/ModalPortal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_EnergyChart|src/components/repertorio/EnergyChart.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_utils_setlistActionPositionAdjust|src/utils/setlistActionPositionAdjust.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_hooks_useSetlistReordering|src/components/repertorio/hooks/useSetlistReordering.ts]] *(from #frontend)*
- [[src_components_repertorio_RepertorioModalsContainer|src/components/repertorio/RepertorioModalsContainer.tsx]] *(from #frontend)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
