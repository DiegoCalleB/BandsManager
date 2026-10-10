---
id: src_components_booking_leads_table_hooks_useLeadsTableController
title: "src/components/booking/leads_table/hooks/useLeadsTableController.ts"
layer: frontend
domain: booking
file: "src/components/booking/leads_table/hooks/useLeadsTableController.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/leads_table/hooks/useLeadsTableController.ts

> **Ubicación:** `src/components/booking/leads_table/hooks/useLeadsTableController.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Controlador de la tabla/rejilla de leads: selección de cabecera, filtrado por tipo de medio,

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_booking_leads_table_hooks_useLeadsBatchDateScan|src/components/booking/leads_table/hooks/useLeadsBatchDateScan.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[ui_leads_table|Leads Table & Actions]] *(Layer: #frontend, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_leads_table_LeadsTableContext|src/components/booking/leads_table/LeadsTableContext.ts]] *(from #frontend)*
- [[ui_leads_table|Leads Table & Actions]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
