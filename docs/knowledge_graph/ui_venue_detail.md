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
- [[route_leads_pitch|Leads Pitch Generation Route]] *(Layer: #route, Domain: #booking)*
- [[route_leads_reply|Leads Reply Route]] *(Layer: #route, Domain: #booking)*
- [[src_components_DirectionsCard|src/components/DirectionsCard.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_booking_BoloConfirmadoSetlistModal|src/components/booking/BoloConfirmadoSetlistModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_DealAndLogisticsCopilot|src/components/booking/DealAndLogisticsCopilot.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_EmailDeliveryTicks|src/components/booking/EmailDeliveryTicks.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_FastDealModal|src/components/booking/FastDealModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_LeadAvatar|src/components/booking/LeadAvatar.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_LeadHealthBadge|src/components/booking/LeadHealthBadge.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_MultiModelPitchComparatorModal|src/components/booking/MultiModelPitchComparatorModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_QuickDealSimulator|src/components/booking/QuickDealSimulator.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_WhatsAppPreviewModal|src/components/booking/WhatsAppPreviewModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_common_FavoriteButton|src/components/common/FavoriteButton.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_HolidayDateWarning|src/components/common/HolidayDateWarning.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_ReliabilityBadge|src/components/common/ReliabilityBadge.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_VerifiedBadge|src/components/common/VerifiedBadge.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_PublicoSilhouette|src/components/ui/PublicoSilhouette.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_bookingFollowup|src/utils/bookingFollowup.ts]] *(Layer: #service, Domain: #booking)*
- [[src_utils_bookingTourContext|src/utils/bookingTourContext.ts]] *(Layer: #service, Domain: #booking)*
- [[src_utils_camposCambiados|src/utils/camposCambiados.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_festivalDateFormat|src/utils/festivalDateFormat.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_leadReliability|src/utils/leadReliability.ts]] *(Layer: #service, Domain: #booking)*
- [[src_utils_whatsapp|src/utils/whatsapp.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_MobileBottomSheet|src/components/booking/MobileBottomSheet.tsx]] *(from #frontend)*
- [[ui_booking_crm|Booking CRM Component]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
