---
id: src_components_booking_crm_BulkActionsSection
title: "src/components/booking/crm/BulkActionsSection.tsx"
layer: frontend
domain: booking
file: "src/components/booking/crm/BulkActionsSection.tsx"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/crm/BulkActionsSection.tsx

> **Ubicación:** `src/components/booking/crm/BulkActionsSection.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Barra de acciones masivas y listado con selección múltiple.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_leads_crud|Leads CRUD Route]] *(Layer: #route, Domain: #booking)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(Layer: #route, Domain: #booking)*
- [[route_leads_pitch|Leads Pitch Generation Route]] *(Layer: #route, Domain: #booking)*
- [[src_components_booking_BulkLeadsActionBar|src/components/booking/BulkLeadsActionBar.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_BulkProgressModal|src/components/booking/BulkProgressModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_crm_BookingCrmContext|src/components/booking/crm/BookingCrmContext.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorMessage|src/utils/errorMessage.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_crm_BookingCrmLayout|src/components/booking/crm/BookingCrmLayout.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
