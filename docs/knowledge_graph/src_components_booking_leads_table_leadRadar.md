---
id: src_components_booking_leads_table_leadRadar
title: "src/components/booking/leads_table/leadRadar.ts"
layer: frontend
domain: booking
file: "src/components/booking/leads_table/leadRadar.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/leads_table/leadRadar.ts

> **Ubicación:** `src/components/booking/leads_table/leadRadar.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Campos que el radar de fechas añade a un lead y que aún no figuran en el tipo `Lead`.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_leads_table_LeadCampaignDates|src/components/booking/leads_table/LeadCampaignDates.tsx]] *(from #frontend)*
- [[src_components_booking_leads_table_LeadDatesTableBadges|src/components/booking/leads_table/LeadDatesTableBadges.tsx]] *(from #frontend)*
- [[src_components_booking_leads_table_LeadSourcePills|src/components/booking/leads_table/LeadSourcePills.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/booking/leads_table/__tests__/leadsTableContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
