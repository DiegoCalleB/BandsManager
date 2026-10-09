---
id: src_components_booking_venue_modal_VenueEmailThread
title: "src/components/booking/venue_modal/VenueEmailThread.tsx"
layer: frontend
domain: booking
file: "src/components/booking/venue_modal/VenueEmailThread.tsx"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/venue_modal/VenueEmailThread.tsx

> **Ubicación:** `src/components/booking/venue_modal/VenueEmailThread.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Exporta: VenueEmailThread.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_leads_crud|Leads CRUD Route]] *(Layer: #route, Domain: #booking)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(Layer: #route, Domain: #booking)*
- [[route_leads_pitch|Leads Pitch Generation Route]] *(Layer: #route, Domain: #booking)*
- [[server_routes_agent|server/routes/agent.ts]] *(Layer: #agent, Domain: #system)*
- [[src_components_booking_EmailDeliveryTicks|src/components/booking/EmailDeliveryTicks.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_bookingFollowup|src/utils/bookingFollowup.ts]] *(Layer: #service, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_venue_modal_VenueWorkspaceModal|src/components/booking/venue_modal/VenueWorkspaceModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
