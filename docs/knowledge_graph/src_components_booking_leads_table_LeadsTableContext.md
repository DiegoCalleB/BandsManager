---
id: src_components_booking_leads_table_LeadsTableContext
title: "src/components/booking/leads_table/LeadsTableContext.ts"
layer: frontend
domain: booking
file: "src/components/booking/leads_table/LeadsTableContext.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/leads_table/LeadsTableContext.ts

> **Ubicación:** `src/components/booking/leads_table/LeadsTableContext.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Contexto de la tabla de leads: reparte el estado del controlador y las props a las vistas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_booking_leads_table_hooks_useLeadsTableController|src/components/booking/leads_table/hooks/useLeadsTableController.ts]] *(Layer: #frontend, Domain: #booking)*
- [[ui_leads_table|Leads Table & Actions]] *(Layer: #frontend, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_leads_table_LeadCampaignDates|src/components/booking/leads_table/LeadCampaignDates.tsx]] *(from #frontend)*
- [[src_components_booking_leads_table_LeadCardActions|src/components/booking/leads_table/LeadCardActions.tsx]] *(from #frontend)*
- [[src_components_booking_leads_table_LeadCardHeader|src/components/booking/leads_table/LeadCardHeader.tsx]] *(from #frontend)*
- [[src_components_booking_leads_table_LeadCardIntelligence|src/components/booking/leads_table/LeadCardIntelligence.tsx]] *(from #frontend)*
- [[src_components_booking_leads_table_LeadDatesInfo|src/components/booking/leads_table/LeadDatesInfo.tsx]] *(from #frontend)*
- [[src_components_booking_leads_table_LeadDatesTableBadges|src/components/booking/leads_table/LeadDatesTableBadges.tsx]] *(from #frontend)*
- [[src_components_booking_leads_table_LeadGridCard|src/components/booking/leads_table/LeadGridCard.tsx]] *(from #frontend)*
- [[src_components_booking_leads_table_LeadRowActions|src/components/booking/leads_table/LeadRowActions.tsx]] *(from #frontend)*
- [[src_components_booking_leads_table_LeadRowContact|src/components/booking/leads_table/LeadRowContact.tsx]] *(from #frontend)*
- [[src_components_booking_leads_table_LeadSourcePills|src/components/booking/leads_table/LeadSourcePills.tsx]] *(from #frontend)*
- [[src_components_booking_leads_table_LeadsTableProvider|src/components/booking/leads_table/LeadsTableProvider.tsx]] *(from #frontend)*
- [[src_components_booking_leads_table_LeadsTableView|src/components/booking/leads_table/LeadsTableView.tsx]] *(from #frontend)*
- [[src_components_booking_leads_table_LeadTableRow|src/components/booking/leads_table/LeadTableRow.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/booking/leads_table/__tests__/leadsTableContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
