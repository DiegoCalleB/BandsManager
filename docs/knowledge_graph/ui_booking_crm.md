---
id: ui_booking_crm
title: "Booking CRM Component"
layer: frontend
domain: booking
file: "src/components/BookingCRM.tsx"
tags: ["ui", "booking", "crm"]
---

# 📌 Booking CRM Component

> **Ubicación:** `src/components/BookingCRM.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Panel principal del embudo de contratación, gestión de salas y radar comercial.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[hook_booking_pipeline|useBookingPipeline Hook]] *(Layer: #hook, Domain: #booking)*
- [[ui_leads_table|Leads Table & Actions]] *(Layer: #frontend, Domain: #booking)*
- [[ui_venue_detail|Venue Detail & Pitch Simulator]] *(Layer: #frontend, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
