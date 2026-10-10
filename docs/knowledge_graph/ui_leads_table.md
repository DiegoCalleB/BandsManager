---
id: ui_leads_table
title: "Leads Table & Actions"
layer: frontend
domain: booking
file: "src/components/booking/LeadsTable.tsx"
tags: ["ui", "booking", "table"]
---

# 📌 Leads Table & Actions

> **Ubicación:** `src/components/booking/LeadsTable.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Tabla interactiva de salas con estados CRM y acciones masivas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[hook_booking_pipeline|useBookingPipeline Hook]] *(Layer: #hook, Domain: #booking)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[src_components_booking_leads_table_LeadsTableProvider|src/components/booking/leads_table/LeadsTableProvider.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_leads_table_LeadsTableView|src/components/booking/leads_table/LeadsTableView.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_leads_table_hooks_useLeadsTableController|src/components/booking/leads_table/hooks/useLeadsTableController.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_crm_ListOrMapArea|src/components/booking/crm/ListOrMapArea.tsx]] *(from #frontend)*
- [[src_components_booking_leads_table_hooks_useLeadsTableController|src/components/booking/leads_table/hooks/useLeadsTableController.ts]] *(from #frontend)*
- [[src_components_booking_leads_table_LeadsTableContext|src/components/booking/leads_table/LeadsTableContext.ts]] *(from #frontend)*
- [[src_components_booking_leads_table_LeadsTableView|src/components/booking/leads_table/LeadsTableView.tsx]] *(from #frontend)*
- [[ui_booking_crm|Booking CRM Component]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
