---
id: src_components_booking_crm_ListOrMapArea
title: "src/components/booking/crm/ListOrMapArea.tsx"
layer: frontend
domain: booking
file: "src/components/booking/crm/ListOrMapArea.tsx"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/crm/ListOrMapArea.tsx

> **Ubicación:** `src/components/booking/crm/ListOrMapArea.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Área principal: mapa de leads o tabla de leads según la vista.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_VenueMap|src/components/VenueMap.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_crm_BookingCrmContext|src/components/booking/crm/BookingCrmContext.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_utils_bookingUtils|src/utils/bookingUtils.ts]] *(Layer: #service, Domain: #booking)*
- [[ui_leads_table|Leads Table & Actions]] *(Layer: #frontend, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_crm_BookingCrmLayout|src/components/booking/crm/BookingCrmLayout.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
