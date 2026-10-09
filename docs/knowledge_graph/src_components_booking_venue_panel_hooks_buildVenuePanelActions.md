---
id: src_components_booking_venue_panel_hooks_buildVenuePanelActions
title: "src/components/booking/venue_panel/hooks/buildVenuePanelActions.ts"
layer: frontend
domain: booking
file: "src/components/booking/venue_panel/hooks/buildVenuePanelActions.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/venue_panel/hooks/buildVenuePanelActions.ts

> **Ubicación:** `src/components/booking/venue_panel/hooks/buildVenuePanelActions.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Acciones del panel de sala: regenerar y revertir pitch, enriquecer ficha, edición, confirmación de bolo, borrador, bitácora y formateo de teléfonos.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_leads_crud|Leads CRUD Route]] *(Layer: #route, Domain: #booking)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(Layer: #route, Domain: #booking)*
- [[route_leads_pitch|Leads Pitch Generation Route]] *(Layer: #route, Domain: #booking)*
- [[route_leads_reply|Leads Reply Route]] *(Layer: #route, Domain: #booking)*
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[server_routes_agent|server/routes/agent.ts]] *(Layer: #agent, Domain: #system)*
- [[server_routes_concerts|server/routes/concerts.ts]] *(Layer: #route, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_camposCambiados|src/utils/camposCambiados.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_venue_detail|Venue Detail & Pitch Simulator]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
