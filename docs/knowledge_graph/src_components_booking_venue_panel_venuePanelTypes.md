---
id: src_components_booking_venue_panel_venuePanelTypes
title: "src/components/booking/venue_panel/venuePanelTypes.ts"
layer: frontend
domain: booking
file: "src/components/booking/venue_panel/venuePanelTypes.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/venue_panel/venuePanelTypes.ts

> **Ubicación:** `src/components/booking/venue_panel/venuePanelTypes.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Tipos compartidos por el contenedor del panel de sala y sus secciones extraídas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_agent|server/routes/agent.ts]] *(Layer: #agent, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_venue_panel_hooks_buildVenuePanelActions|src/components/booking/venue_panel/hooks/buildVenuePanelActions.ts]] *(from #frontend)*
- [[src_components_booking_venue_panel_VenueEmailsSection|src/components/booking/venue_panel/VenueEmailsSection.tsx]] *(from #frontend)*
- [[ui_venue_detail|Venue Detail & Pitch Simulator]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
