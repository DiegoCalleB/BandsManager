---
id: ui_booking_crm
title: "Booking CRM Component"
layer: frontend
domain: booking
file: "src/components/BookingCRM.tsx"
tags: ["ui", "booking", "crm"]
---

# 📌 Booking CRM Component

> **Ubicación:** `src/components/BookingCRM.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Panel principal del embudo de contratación, gestión de salas y radar comercial.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[hook_booking_pipeline|useBookingPipeline Hook]] *(Layer: #hook, Domain: #booking)*
- [[src_components_booking_crm_BookingCrmLayout|src/components/booking/crm/BookingCrmLayout.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_crm_BookingCrmProvider|src/components/booking/crm/BookingCrmProvider.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_crm_hooks_useBookingCrmController|src/components/booking/crm/hooks/useBookingCrmController.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_bookingUtils|src/utils/bookingUtils.ts]] *(Layer: #service, Domain: #booking)*
- [[ui_leads_table|Leads Table & Actions]] *(Layer: #frontend, Domain: #booking)*
- [[ui_venue_detail|Venue Detail & Pitch Simulator]] *(Layer: #frontend, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[src_App|src/App.tsx]] *(from #frontend)*
- [[src_components_booking_crm_BookingCrmContext|src/components/booking/crm/BookingCrmContext.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
