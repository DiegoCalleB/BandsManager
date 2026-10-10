---
id: src_utils_leadReliability
title: "src/utils/leadReliability.ts"
layer: service
domain: booking
file: "src/utils/leadReliability.ts"
tags: ["service", "booking", "auto"]
---

# 📌 src/utils/leadReliability.ts

> **Ubicación:** `src/utils/leadReliability.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
Exporta: calculateLeadReliability, isLeadVerificado.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_BandCRM|src/components/BandCRM.tsx]] *(from #frontend)*
- [[src_components_booking_venue_modal_VenueModalHeader|src/components/booking/venue_modal/VenueModalHeader.tsx]] *(from #frontend)*
- [[src_components_booking_venue_panel_VenueTitleBar|src/components/booking/venue_panel/VenueTitleBar.tsx]] *(from #frontend)*
- [[src_components_common_ReliabilityBadge|src/components/common/ReliabilityBadge.tsx]] *(from #frontend)*
- [[ui_leads_table|Leads Table & Actions]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
