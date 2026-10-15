---
id: src_components_tour_manager_hooks_useTourManagerController
title: "src/components/tour_manager/hooks/useTourManagerController.ts"
layer: frontend
domain: system
file: "src/components/tour_manager/hooks/useTourManagerController.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/tour_manager/hooks/useTourManagerController.ts

> **Ubicación:** `src/components/tour_manager/hooks/useTourManagerController.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Controlador del gestor de giras: formulario, modal, guardado y borrado.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_tour_manager_hooks_useTourDelete|src/components/tour_manager/hooks/useTourDelete.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_tour_manager_hooks_useTourForm|src/components/tour_manager/hooks/useTourForm.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_tour_manager_hooks_useTourModal|src/components/tour_manager/hooks/useTourModal.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_tour_manager_hooks_useTourSave|src/components/tour_manager/hooks/useTourSave.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_tour_manager_TourManagerContext|src/components/tour_manager/TourManagerContext.ts]] *(from #frontend)*
- [[src_components_TourManager|src/components/TourManager.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
