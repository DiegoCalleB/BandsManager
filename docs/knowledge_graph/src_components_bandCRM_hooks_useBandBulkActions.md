---
id: src_components_bandCRM_hooks_useBandBulkActions
title: "src/components/bandCRM/hooks/useBandBulkActions.ts"
layer: frontend
domain: booking
file: "src/components/bandCRM/hooks/useBandBulkActions.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/bandCRM/hooks/useBandBulkActions.ts

> **Ubicación:** `src/components/bandCRM/hooks/useBandBulkActions.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Acciones masivas sobre bandas: estado, favoritas, borrado, exportación CSV y generación de propuestas de swap.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_bandCRM_bandCrmTypes|src/components/bandCRM/bandCrmTypes.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_BulkProgressModal|src/components/booking/BulkProgressModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_bandCRM_hooks_useBandCrmController|src/components/bandCRM/hooks/useBandCrmController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
