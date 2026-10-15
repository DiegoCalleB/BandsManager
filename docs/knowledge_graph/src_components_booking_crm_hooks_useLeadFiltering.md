---
id: src_components_booking_crm_hooks_useLeadFiltering
title: "src/components/booking/crm/hooks/useLeadFiltering.ts"
layer: frontend
domain: booking
file: "src/components/booking/crm/hooks/useLeadFiltering.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/crm/hooks/useLeadFiltering.ts

> **Ubicación:** `src/components/booking/crm/hooks/useLeadFiltering.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Leads visibles de la sección activa tras aplicar campaña, ciudad, tipo, estado, capacidad y búsqueda.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_booking_crm_leadTypeMatchers|src/components/booking/crm/leadTypeMatchers.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_bookingFollowup|src/utils/bookingFollowup.ts]] *(Layer: #service, Domain: #booking)*
- [[src_utils_bookingUtils|src/utils/bookingUtils.ts]] *(Layer: #service, Domain: #booking)*
- [[src_utils_campaignMatch|src/utils/campaignMatch.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_tourRouting|src/utils/tourRouting.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_crm_hooks_useBookingCrmController|src/components/booking/crm/hooks/useBookingCrmController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
