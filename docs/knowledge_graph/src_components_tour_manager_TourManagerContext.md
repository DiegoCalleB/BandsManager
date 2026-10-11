---
id: src_components_tour_manager_TourManagerContext
title: "src/components/tour_manager/TourManagerContext.ts"
layer: frontend
domain: system
file: "src/components/tour_manager/TourManagerContext.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/tour_manager/TourManagerContext.ts

> **Ubicación:** `src/components/tour_manager/TourManagerContext.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Contexto del gestor de giras: reparte el estado del controlador y las props a las vistas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_TourManager|src/components/TourManager.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_tour_manager_hooks_useTourManagerController|src/components/tour_manager/hooks/useTourManagerController.ts]] *(Layer: #frontend, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_tour_manager_TourCardsGrid|src/components/tour_manager/TourCardsGrid.tsx]] *(from #frontend)*
- [[src_components_tour_manager_TourConvocatoriaSection|src/components/tour_manager/TourConvocatoriaSection.tsx]] *(from #frontend)*
- [[src_components_tour_manager_TourDeleteModal|src/components/tour_manager/TourDeleteModal.tsx]] *(from #frontend)*
- [[src_components_tour_manager_TourEditModal|src/components/tour_manager/TourEditModal.tsx]] *(from #frontend)*
- [[src_components_tour_manager_TourFleetSection|src/components/tour_manager/TourFleetSection.tsx]] *(from #frontend)*
- [[src_components_tour_manager_TourManagerHeader|src/components/tour_manager/TourManagerHeader.tsx]] *(from #frontend)*
- [[src_components_tour_manager_TourManagerProvider|src/components/tour_manager/TourManagerProvider.tsx]] *(from #frontend)*
- [[src_components_tour_manager_TourManagerView|src/components/tour_manager/TourManagerView.tsx]] *(from #frontend)*
- [[src_components_tour_manager_TourStatsSummary|src/components/tour_manager/TourStatsSummary.tsx]] *(from #frontend)*
- [[src_components_tour_manager_TourStopsSection|src/components/tour_manager/TourStopsSection.tsx]] *(from #frontend)*
- [[src_components_tour_manager_TourSyncOptions|src/components/tour_manager/TourSyncOptions.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/tour_manager/__tests__/tourManagerContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
