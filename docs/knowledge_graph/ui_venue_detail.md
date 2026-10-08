---
id: ui_venue_detail
title: "Venue Detail & Pitch Simulator"
layer: frontend
domain: booking
file: "src/components/booking/VenueDetailPanel.tsx"
tags: ["ui", "booking", "pitch"]
---

# 📌 Venue Detail & Pitch Simulator

> **Ubicación:** `src/components/booking/VenueDetailPanel.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Ficha técnica de la sala, hilo de conversación y generador de respuestas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_leads_pitch|Leads Pitch Generation Route]] *(Layer: #route, Domain: #booking)*
- [[route_leads_reply|Leads Reply Route]] *(Layer: #route, Domain: #booking)*
- [[agent_redactor|Agente Redactor (borradores de respuesta)]] *(Layer: #agent, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_booking_crm|Booking CRM Component]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
