---
id: src_components_booking_LeadHealthBadge
title: "src/components/booking/LeadHealthBadge.tsx"
layer: frontend
domain: booking
file: "src/components/booking/LeadHealthBadge.tsx"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/LeadHealthBadge.tsx

> **Ubicación:** `src/components/booking/LeadHealthBadge.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Exporta: LeadTemperature, LeadHealthInfo, getLeadHealth, LeadHealthBadge.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_venue_modal_VenueModalHeader|src/components/booking/venue_modal/VenueModalHeader.tsx]] *(from #frontend)*
- [[src_components_booking_venue_panel_VenueLeadHealthRow|src/components/booking/venue_panel/VenueLeadHealthRow.tsx]] *(from #frontend)*
- [[ui_leads_table|Leads Table & Actions]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
