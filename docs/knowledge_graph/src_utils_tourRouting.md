---
id: src_utils_tourRouting
title: "src/utils/tourRouting.ts"
layer: service
domain: system
file: "src/utils/tourRouting.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/tourRouting.ts

> **Ubicación:** `src/utils/tourRouting.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: ProvinceCorridor, SPANISH_TOUR_CORRIDORS, normalizeLocationName, findCorridorForCity, areCitiesLogisticallyCompatible, TourRoutingOpportunity, findTourRoutingOpportunities, LeadScoreBreakdown.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_leads_pitch|Leads Pitch Generation Route]] *(from #route)*
- [[service_pitch_engine|Pitch Engine & Multi-Model Routing]] *(from #service)*
- [[src_components_booking_DealAndLogisticsCopilot|src/components/booking/DealAndLogisticsCopilot.tsx]] *(from #frontend)*
- [[src_components_booking_MorningBriefingRadar|src/components/booking/MorningBriefingRadar.tsx]] *(from #frontend)*
- [[src_utils_bookingTourContext|src/utils/bookingTourContext.ts]] *(from #service)*
- [[src_utils_managerAlerts|src/utils/managerAlerts.ts]] *(from #service)*
- [[ui_booking_crm|Booking CRM Component]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
