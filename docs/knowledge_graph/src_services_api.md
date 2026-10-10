---
id: src_services_api
title: "src/services/api.ts"
layer: service
domain: system
file: "src/services/api.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/services/api.ts

> **Ubicación:** `src/services/api.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: ApiError, getAuthHeaders, api.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_leads_crud|Leads CRUD Route]] *(Layer: #route, Domain: #booking)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(Layer: #route, Domain: #booking)*
- [[route_leads_pitch|Leads Pitch Generation Route]] *(Layer: #route, Domain: #booking)*
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_bands_responseStrategies|server/routes/bands/responseStrategies.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_campaigns|server/routes/campaigns.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_concerts|server/routes/concerts.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_donations|server/routes/donations.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(Layer: #route, Domain: #epk)*
- [[server_routes_gmailOAuth|server/routes/gmailOAuth.ts]] *(Layer: #security, Domain: #auth)*
- [[server_routes_metrics|server/routes/metrics.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_posts|server/routes/posts.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_tours|server/routes/tours.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_users|server/routes/users.ts]] *(Layer: #route, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[hook_app_data|useAppData Hook]] *(from #hook)*
- [[src_App|src/App.tsx]] *(from #frontend)*
- [[src_components_bandCRM_BandToneModal|src/components/bandCRM/BandToneModal.tsx]] *(from #frontend)*
- [[src_components_bandCRM_hooks_useBandBulkActions|src/components/bandCRM/hooks/useBandBulkActions.ts]] *(from #frontend)*
- [[src_components_BandSwitcherModal|src/components/BandSwitcherModal.tsx]] *(from #frontend)*
- [[src_components_booking_GooglePlacesExplorerModal|src/components/booking/GooglePlacesExplorerModal.tsx]] *(from #frontend)*
- [[src_components_booking_MultiModelPitchComparatorModal|src/components/booking/MultiModelPitchComparatorModal.tsx]] *(from #frontend)*
- [[src_components_booking_venue_panel_hooks_useVenueMessageThread|src/components/booking/venue_panel/hooks/useVenueMessageThread.ts]] *(from #frontend)*
- [[src_components_calendar_hooks_useCalendarFeed|src/components/calendar/hooks/useCalendarFeed.ts]] *(from #frontend)*
- [[src_components_chatbot_hooks_useAgentRuns|src/components/chatbot/hooks/useAgentRuns.ts]] *(from #agent)*
- [[src_components_chatbot_hooks_useEntityActions|src/components/chatbot/hooks/useEntityActions.ts]] *(from #frontend)*
- [[src_components_CheckoutButton|src/components/CheckoutButton.tsx]] *(from #frontend)*
- [[src_components_Dashboard|src/components/Dashboard.tsx]] *(from #frontend)*
- [[src_components_dashboard_agent_autonomy_hooks_useAutonomyConfig|src/components/dashboard/agent_autonomy/hooks/useAutonomyConfig.ts]] *(from #agent)*
- [[src_components_dashboard_agent_autonomy_hooks_useResponseStrategies|src/components/dashboard/agent_autonomy/hooks/useResponseStrategies.ts]] *(from #agent)*
- [[src_components_dashboard_AiUsageSupportWidget|src/components/dashboard/AiUsageSupportWidget.tsx]] *(from #frontend)*
- [[src_components_dashboard_DashboardWidgetGrid|src/components/dashboard/DashboardWidgetGrid.tsx]] *(from #frontend)*
- [[src_components_dashboard_ProfileCompletenessCard|src/components/dashboard/ProfileCompletenessCard.tsx]] *(from #frontend)*
- [[src_components_dashboard_widgets_ChartWidgets|src/components/dashboard/widgets/ChartWidgets.tsx]] *(from #frontend)*
- [[src_components_dashboard_widgets_ModuleWidgets|src/components/dashboard/widgets/ModuleWidgets.tsx]] *(from #frontend)*
- [[src_components_EmailAccountConfig|src/components/EmailAccountConfig.tsx]] *(from #frontend)*
- [[src_components_ensayos_EnsayosManager|src/components/ensayos/EnsayosManager.tsx]] *(from #frontend)*
- [[src_components_epk_AILogoGeneratorModal|src/components/epk/AILogoGeneratorModal.tsx]] *(from #frontend)*
- [[src_components_EPKManager|src/components/EPKManager.tsx]] *(from #frontend)*
- [[src_components_Merchan|src/components/Merchan.tsx]] *(from #frontend)*
- [[src_components_onboarding_OnboardingWizardModal|src/components/onboarding/OnboardingWizardModal.tsx]] *(from #frontend)*
- [[src_components_Planes|src/components/Planes.tsx]] *(from #frontend)*
- [[src_components_reels_metrics_hooks_useContentItems|src/components/reels/metrics/hooks/useContentItems.ts]] *(from #frontend)*
- [[src_components_reels_metrics_hooks_useGrowthPlan|src/components/reels/metrics/hooks/useGrowthPlan.ts]] *(from #frontend)*
- [[src_components_reels_metrics_hooks_useInstagramConnection|src/components/reels/metrics/hooks/useInstagramConnection.ts]] *(from #frontend)*
- [[src_components_reels_metrics_hooks_useScreenshotScan|src/components/reels/metrics/hooks/useScreenshotScan.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useRepertorioData|src/components/repertorio/hooks/useRepertorioData.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useSetlistReordering|src/components/repertorio/hooks/useSetlistReordering.ts]] *(from #frontend)*
- [[src_components_repertorio_ImportSetlistModal|src/components/repertorio/ImportSetlistModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_SetlistAIAnalysisModal|src/components/repertorio/SetlistAIAnalysisModal.tsx]] *(from #frontend)*
- [[src_components_SpotifyPlayerBar|src/components/SpotifyPlayerBar.tsx]] *(from #frontend)*
- [[src_components_UserProfileModal|src/components/UserProfileModal.tsx]] *(from #frontend)*
- [[src_hooks_useAuth|src/hooks/useAuth.ts]] *(from #security)*
- [[src_hooks_useEmailTemplates|src/hooks/useEmailTemplates.ts]] *(from #hook)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(from #service)*
- [[src_utils_calendarViewPreferences|src/utils/calendarViewPreferences.ts]] *(from #service)*
- [[src_utils_userPreferences|src/utils/userPreferences.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
