---
id: src_components_booking_venue_panel_VenueTitleBar
title: "src/components/booking/venue_panel/VenueTitleBar.tsx"
layer: frontend
domain: booking
file: "src/components/booking/venue_panel/VenueTitleBar.tsx"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/venue_panel/VenueTitleBar.tsx

> **Ubicación:** `src/components/booking/venue_panel/VenueTitleBar.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Barra de título del panel con avatar, estado y acciones.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_booking_LeadAvatar|src/components/booking/LeadAvatar.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_venue_panel_VenueAgentWorkflowBanner|src/components/booking/venue_panel/VenueAgentWorkflowBanner.tsx]] *(Layer: #agent, Domain: #booking)*
- [[src_components_booking_venue_panel_VenueLeadHealthRow|src/components/booking/venue_panel/VenueLeadHealthRow.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_venue_panel_VenueQuickActionBar|src/components/booking/venue_panel/VenueQuickActionBar.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_venue_panel_VenueScoutToolbar|src/components/booking/venue_panel/VenueScoutToolbar.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_common_FavoriteButton|src/components/common/FavoriteButton.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_HolidayDateWarning|src/components/common/HolidayDateWarning.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_VerifiedBadge|src/components/common/VerifiedBadge.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_festivalDateFormat|src/utils/festivalDateFormat.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_leadReliability|src/utils/leadReliability.ts]] *(Layer: #service, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_venue_detail|Venue Detail & Pitch Simulator]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
