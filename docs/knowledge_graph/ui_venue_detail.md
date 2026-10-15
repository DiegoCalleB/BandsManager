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
- [[agent_redactor|Agente Redactor (borradores de respuesta)]] *(Layer: #agent, Domain: #booking)*
- [[route_leads_crud|Leads CRUD Route]] *(Layer: #route, Domain: #booking)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(Layer: #route, Domain: #booking)*
- [[route_leads_pitch|Leads Pitch Generation Route]] *(Layer: #route, Domain: #booking)*
- [[route_leads_reply|Leads Reply Route]] *(Layer: #route, Domain: #booking)*
- [[src_components_booking_BoloConfirmadoSetlistModal|src/components/booking/BoloConfirmadoSetlistModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_DealAndLogisticsCopilot|src/components/booking/DealAndLogisticsCopilot.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_FastDealModal|src/components/booking/FastDealModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_MultiModelPitchComparatorModal|src/components/booking/MultiModelPitchComparatorModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_WhatsAppPreviewModal|src/components/booking/WhatsAppPreviewModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_venue_panel_VenueBitacoraSection|src/components/booking/venue_panel/VenueBitacoraSection.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_venue_panel_VenueContactRosterCards|src/components/booking/venue_panel/VenueContactRosterCards.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_venue_panel_VenueEmailsSection|src/components/booking/venue_panel/VenueEmailsSection.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_venue_panel_VenueIntelligenceSection|src/components/booking/venue_panel/VenueIntelligenceSection.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_venue_panel_VenuePitchInfoSection|src/components/booking/venue_panel/VenuePitchInfoSection.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_venue_panel_VenueTitleBar|src/components/booking/venue_panel/VenueTitleBar.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_venue_panel_apiResponses|src/components/booking/venue_panel/apiResponses.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_venue_panel_hooks_buildVenuePanelActions|src/components/booking/venue_panel/hooks/buildVenuePanelActions.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_venue_panel_hooks_useVenueEnrichment|src/components/booking/venue_panel/hooks/useVenueEnrichment.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_venue_panel_hooks_useVenueMessageThread|src/components/booking/venue_panel/hooks/useVenueMessageThread.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_venue_panel_hooks_useVenueScoutActions|src/components/booking/venue_panel/hooks/useVenueScoutActions.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_venue_panel_venuePanelTypes|src/components/booking/venue_panel/venuePanelTypes.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_venue_panel_venueTheme|src/components/booking/venue_panel/venueTheme.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorMessage|src/utils/errorMessage.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_MobileBottomSheet|src/components/booking/MobileBottomSheet.tsx]] *(from #frontend)*
- [[ui_booking_crm|Booking CRM Component]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/booking/__tests__/venuePanelContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
