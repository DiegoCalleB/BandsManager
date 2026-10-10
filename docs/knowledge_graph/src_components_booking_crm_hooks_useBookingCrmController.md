---
id: src_components_booking_crm_hooks_useBookingCrmController
title: "src/components/booking/crm/hooks/useBookingCrmController.ts"
layer: frontend
domain: booking
file: "src/components/booking/crm/hooks/useBookingCrmController.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/crm/hooks/useBookingCrmController.ts

> **Ubicación:** `src/components/booking/crm/hooks/useBookingCrmController.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Compone los hooks del CRM de booking (navegación, selección, edición, formularios, rastreo, filtrado y acciones).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_booking_crm_hooks_useCrmNavigation|src/components/booking/crm/hooks/useCrmNavigation.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_crm_hooks_useLeadActions|src/components/booking/crm/hooks/useLeadActions.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_crm_hooks_useLeadEditing|src/components/booking/crm/hooks/useLeadEditing.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_crm_hooks_useLeadFiltering|src/components/booking/crm/hooks/useLeadFiltering.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_crm_hooks_useLeadFormsAndEnrichment|src/components/booking/crm/hooks/useLeadFormsAndEnrichment.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_crm_hooks_useLeadScraping|src/components/booking/crm/hooks/useLeadScraping.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_crm_hooks_useLeadSelectionAndTemplates|src/components/booking/crm/hooks/useLeadSelectionAndTemplates.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_crm_BookingCrmContext|src/components/booking/crm/BookingCrmContext.ts]] *(from #frontend)*
- [[ui_booking_crm|Booking CRM Component]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
