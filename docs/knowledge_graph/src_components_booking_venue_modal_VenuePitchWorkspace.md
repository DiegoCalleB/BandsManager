---
id: src_components_booking_venue_modal_VenuePitchWorkspace
title: "src/components/booking/venue_modal/VenuePitchWorkspace.tsx"
layer: frontend
domain: booking
file: "src/components/booking/venue_modal/VenuePitchWorkspace.tsx"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/venue_modal/VenuePitchWorkspace.tsx

> **Ubicación:** `src/components/booking/venue_modal/VenuePitchWorkspace.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Exporta: VenuePitchWorkspace.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_leads_pitch|Leads Pitch Generation Route]] *(Layer: #route, Domain: #booking)*
- [[route_leads_reply|Leads Reply Route]] *(Layer: #route, Domain: #booking)*
- [[server_routes_agent|server/routes/agent.ts]] *(Layer: #agent, Domain: #system)*
- [[src_components_booking_MultiModelPitchComparatorModal|src/components/booking/MultiModelPitchComparatorModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_venue_modal_VenueWorkspaceModal|src/components/booking/venue_modal/VenueWorkspaceModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
