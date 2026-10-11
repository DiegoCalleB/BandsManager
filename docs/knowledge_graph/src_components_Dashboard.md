---
id: src_components_Dashboard
title: "src/components/Dashboard.tsx"
layer: frontend
domain: system
file: "src/components/Dashboard.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/Dashboard.tsx

> **Ubicación:** `src/components/Dashboard.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: NavigationOptions, Dashboard.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(Layer: #route, Domain: #booking)*
- [[src_components_DirectionsCard|src/components/DirectionsCard.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_booking_MobileBottomSheet|src/components/booking/MobileBottomSheet.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_dashboard_AddLeadModal|src/components/dashboard/AddLeadModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_dashboard_AgentAutonomySettingsModal|src/components/dashboard/AgentAutonomySettingsModal.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_components_dashboard_AiUsageSupportWidget|src/components/dashboard/AiUsageSupportWidget.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_dashboard_AlertSettingsModal|src/components/dashboard/AlertSettingsModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_dashboard_DashboardWidgetGrid|src/components/dashboard/DashboardWidgetGrid.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_dashboard_EmailTemplatesModal|src/components/dashboard/EmailTemplatesModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_dashboard_ManagerAlertsWidget|src/components/dashboard/ManagerAlertsWidget.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_dashboard_NeedsAttentionBanner|src/components/dashboard/NeedsAttentionBanner.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_dashboard_NextGigStrip|src/components/dashboard/NextGigStrip.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_dashboard_ProfileCompletenessCard|src/components/dashboard/ProfileCompletenessCard.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_dashboard_SocialAndFansGrowthChart|src/components/dashboard/SocialAndFansGrowthChart.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_ensayos_ConvocarEnsayoModal|src/components/ensayos/ConvocarEnsayoModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_PopoverAncla|src/components/ui/PopoverAncla.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_PublicoSilhouette|src/components/ui/PublicoSilhouette.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_context_LanguageContext|src/context/LanguageContext.tsx]] *(Layer: #service, Domain: #system)*
- [[src_context_PlayerContext|src/context/PlayerContext.tsx]] *(Layer: #service, Domain: #system)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_bandUtils|src/utils/bandUtils.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_bookingUtils|src/utils/bookingUtils.ts]] *(Layer: #service, Domain: #booking)*
- [[src_utils_leadStatusPresentation|src/utils/leadStatusPresentation.ts]] *(Layer: #service, Domain: #booking)*
- [[src_utils_managerAlerts|src/utils/managerAlerts.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_planPermissions|src/utils/planPermissions.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_metricas_panel|Panel y métricas]] *(from #feature)*
- [[src_app_ActiveViewRouter|src/app/ActiveViewRouter.tsx]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
