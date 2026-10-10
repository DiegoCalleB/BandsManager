---
id: src_components_booking_leads_table_hooks_useLeadsBatchDateScan
title: "src/components/booking/leads_table/hooks/useLeadsBatchDateScan.ts"
layer: frontend
domain: booking
file: "src/components/booking/leads_table/hooks/useLeadsBatchDateScan.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/leads_table/hooks/useLeadsBatchDateScan.ts

> **Ubicación:** `src/components/booking/leads_table/hooks/useLeadsBatchDateScan.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Escaneo en lote de fechas libres de los recintos.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_leads_crud|Leads CRUD Route]] *(Layer: #route, Domain: #booking)*
- [[src_hooks_useEmailValidation|src/hooks/useEmailValidation.ts]] *(Layer: #hook, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_leads_table_hooks_useLeadsTableController|src/components/booking/leads_table/hooks/useLeadsTableController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
