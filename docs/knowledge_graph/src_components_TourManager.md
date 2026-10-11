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
Gestor de giras: vehículos, dietas, paradas, convocados y volcado a calendario y finanzas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_app_appViews|src/app/appViews.ts]] *(Layer: #service, Domain: #system)*
- [[src_components_tour_manager_TourManagerProvider|src/components/tour_manager/TourManagerProvider.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_tour_manager_TourManagerView|src/components/tour_manager/TourManagerView.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_tour_manager_hooks_useTourManagerController|src/components/tour_manager/hooks/useTourManagerController.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_gira|Tour Manager]] *(from #feature)*
- [[src_app_lazyViews|src/app/lazyViews.ts]] *(from #service)*
- [[src_components_tour_manager_TourManagerContext|src/components/tour_manager/TourManagerContext.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
