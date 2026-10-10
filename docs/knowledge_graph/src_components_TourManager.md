---
id: src_components_TourManager
title: "src/components/TourManager.tsx"
layer: frontend
domain: system
file: "src/components/TourManager.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/TourManager.tsx

> **Ubicación:** `src/components/TourManager.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: TourManager.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_common_HolidayDateWarning|src/components/common/HolidayDateWarning.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_ModalPortal|src/components/common/ModalPortal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_PublicoSilhouette|src/components/ui/PublicoSilhouette.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_tourUtils|src/utils/tourUtils.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_gira|Tour Manager]] *(from #feature)*
- [[src_app_lazyViews|src/app/lazyViews.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
