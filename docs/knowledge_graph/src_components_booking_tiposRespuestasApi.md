---
id: src_components_booking_tiposRespuestasApi
title: "src/components/booking/tiposRespuestasApi.ts"
layer: frontend
domain: booking
file: "src/components/booking/tiposRespuestasApi.ts"
tags: ["frontend", "booking", "auto"]
---

# 📌 src/components/booking/tiposRespuestasApi.ts

> **Ubicación:** `src/components/booking/tiposRespuestasApi.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Formas de las respuestas JSON de los endpoints que consume el CRM de booking.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_booking_crm_crmTypes|src/components/booking/crm/crmTypes.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_google_places_placesModel|src/components/booking/google_places/placesModel.ts]] *(Layer: #frontend, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_AddLeadModal|src/components/booking/AddLeadModal.tsx]] *(from #frontend)*
- [[src_components_booking_AgentQueueMonitorModal|src/components/booking/AgentQueueMonitorModal.tsx]] *(from #agent)*
- [[src_components_booking_crm_BulkActionsSection|src/components/booking/crm/BulkActionsSection.tsx]] *(from #frontend)*
- [[src_components_booking_crm_hooks_useLeadScraping|src/components/booking/crm/hooks/useLeadScraping.ts]] *(from #frontend)*
- [[src_components_booking_CRMContactEnricherModal|src/components/booking/CRMContactEnricherModal.tsx]] *(from #frontend)*
- [[src_components_booking_ExcelImportModal|src/components/booking/ExcelImportModal.tsx]] *(from #frontend)*
- [[src_components_booking_google_places_hooks_useAlternativePlaceSources|src/components/booking/google_places/hooks/useAlternativePlaceSources.ts]] *(from #frontend)*
- [[src_components_booking_google_places_hooks_useMassCampaignSearch|src/components/booking/google_places/hooks/useMassCampaignSearch.ts]] *(from #frontend)*
- [[src_components_booking_google_places_hooks_usePlaceCrmImport|src/components/booking/google_places/hooks/usePlaceCrmImport.ts]] *(from #frontend)*
- [[src_components_booking_google_places_hooks_usePlaceEmailExtraction|src/components/booking/google_places/hooks/usePlaceEmailExtraction.ts]] *(from #frontend)*
- [[src_components_booking_google_places_hooks_usePlaceSearch|src/components/booking/google_places/hooks/usePlaceSearch.ts]] *(from #frontend)*
- [[src_components_booking_venue_modal_VenueEmailThread|src/components/booking/venue_modal/VenueEmailThread.tsx]] *(from #frontend)*
- [[src_components_booking_venue_modal_VenuePitchWorkspace|src/components/booking/venue_modal/VenuePitchWorkspace.tsx]] *(from #frontend)*
- [[src_components_booking_venue_modal_VenueProfileColumn|src/components/booking/venue_modal/VenueProfileColumn.tsx]] *(from #frontend)*
- [[src_components_booking_venue_panel_hooks_buildVenuePanelActions|src/components/booking/venue_panel/hooks/buildVenuePanelActions.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
