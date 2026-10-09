---
id: src_utils_bookingUtils
title: "src/utils/bookingUtils.ts"
layer: service
domain: booking
file: "src/utils/bookingUtils.ts"
tags: ["service", "booking", "auto"]
---

# 📌 src/utils/bookingUtils.ts

> **Ubicación:** `src/utils/bookingUtils.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
Exporta: BookingMetrics, normalizeStatus, normalizeType, VENUE_ADDRESS_DATABASE, autoDetectVenueAddress, calculateBookingMetrics, filterLeads, calculateLeadScore.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[hook_booking_pipeline|useBookingPipeline Hook]] *(from #hook)*
- [[src_components_Dashboard|src/components/Dashboard.tsx]] *(from #frontend)*
- [[src_hooks_useCityChips|src/hooks/useCityChips.ts]] *(from #hook)*
- [[ui_booking_crm|Booking CRM Component]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/bookingUtils.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
