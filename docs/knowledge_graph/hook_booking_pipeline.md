---
id: hook_booking_pipeline
title: "useBookingPipeline Hook"
layer: hook
domain: booking
file: "src/hooks/useBookingPipeline.ts"
tags: ["hook", "state", "booking"]
---

# 📌 useBookingPipeline Hook

> **Ubicación:** `src/hooks/useBookingPipeline.ts`  
> **Capa:** `#layer/hook` | **Dominio:** `#domain/booking`

## 📖 Descripción
Gestión del estado reactivo del pipeline de salas, filtros y transiciones de estado.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_leads_crud|Leads CRUD Route]] *(Layer: #route, Domain: #booking)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_booking_crm|Booking CRM Component]] *(from #frontend)*
- [[ui_leads_table|Leads Table & Actions]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
