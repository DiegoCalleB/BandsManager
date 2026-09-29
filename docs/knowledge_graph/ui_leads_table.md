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

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_booking_crm|Booking CRM Component]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
