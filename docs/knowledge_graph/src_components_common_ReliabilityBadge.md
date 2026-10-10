---
id: src_components_common_ReliabilityBadge
title: "src/components/common/ReliabilityBadge.tsx"
layer: frontend
domain: system
file: "src/components/common/ReliabilityBadge.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/common/ReliabilityBadge.tsx

> **Ubicación:** `src/components/common/ReliabilityBadge.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: ReliabilityBadge.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_leadReliability|src/utils/leadReliability.ts]] *(Layer: #service, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_bandCRM_BandCardsGrid|src/components/bandCRM/BandCardsGrid.tsx]] *(from #frontend)*
- [[src_components_booking_leads_table_LeadCardQualityBadges|src/components/booking/leads_table/LeadCardQualityBadges.tsx]] *(from #frontend)*
- [[src_components_booking_leads_table_LeadTableRow|src/components/booking/leads_table/LeadTableRow.tsx]] *(from #frontend)*
- [[src_components_booking_venue_panel_VenueLeadHealthRow|src/components/booking/venue_panel/VenueLeadHealthRow.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
