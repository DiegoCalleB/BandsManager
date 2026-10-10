---
id: src_utils_planPermissions
title: "src/utils/planPermissions.ts"
layer: service
domain: system
file: "src/utils/planPermissions.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/planPermissions.ts

> **Ubicación:** `src/utils/planPermissions.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: SubscriptionPlanId, PlanFeature, PlanDefinition, PLANS, normalizePlan, getPlanDefinition, isElitePlan, getPlanTierLevel.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_DesktopSidebar|src/app/DesktopSidebar.tsx]] *(from #service)*
- [[src_app_hooks_useActiveBand|src/app/hooks/useActiveBand.ts]] *(from #service)*
- [[src_app_hooks_useAppNavigation|src/app/hooks/useAppNavigation.ts]] *(from #service)*
- [[src_app_hooks_usePlanLimitGuards|src/app/hooks/usePlanLimitGuards.ts]] *(from #service)*
- [[src_app_MobileDrawer|src/app/MobileDrawer.tsx]] *(from #service)*
- [[src_app_MobileGroupSheet|src/app/MobileGroupSheet.tsx]] *(from #service)*
- [[src_app_MobileTopBar|src/app/MobileTopBar.tsx]] *(from #service)*
- [[src_components_band_switcher_BandCardsGrid|src/components/band_switcher/BandCardsGrid.tsx]] *(from #frontend)*
- [[src_components_band_switcher_UpgradePlanModal|src/components/band_switcher/UpgradePlanModal.tsx]] *(from #frontend)*
- [[src_components_calendar_hooks_useCalendarController|src/components/calendar/hooks/useCalendarController.ts]] *(from #frontend)*
- [[src_components_calendar_logistics_EventSetlistWidget|src/components/calendar/logistics/EventSetlistWidget.tsx]] *(from #frontend)*
- [[src_components_common_NavGroupSection|src/components/common/NavGroupSection.tsx]] *(from #frontend)*
- [[src_components_Dashboard|src/components/Dashboard.tsx]] *(from #frontend)*
- [[src_components_dashboard_AlertSettingsModal|src/components/dashboard/AlertSettingsModal.tsx]] *(from #frontend)*
- [[src_components_dashboard_DashboardWidgetGrid|src/components/dashboard/DashboardWidgetGrid.tsx]] *(from #frontend)*
- [[src_components_EPKManager|src/components/EPKManager.tsx]] *(from #frontend)*
- [[src_components_onboarding_OnboardingWizardModal|src/components/onboarding/OnboardingWizardModal.tsx]] *(from #frontend)*
- [[src_components_Planes|src/components/Planes.tsx]] *(from #frontend)*
- [[src_components_PlanLimitModal|src/components/PlanLimitModal.tsx]] *(from #frontend)*
- [[src_components_UserProfileModal|src/components/UserProfileModal.tsx]] *(from #frontend)*
- [[src_utils_managerAlerts|src/utils/managerAlerts.ts]] *(from #service)*
- [[src_utils_roiBanda|src/utils/roiBanda.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/referidos.test.ts`
- `src/components/onboarding/__tests__/onboardingPlanGating.test.ts`
- `src/config/__tests__/navGroups.test.ts`
- `src/utils/__tests__/documentacionPlanes.test.ts`
- `src/utils/__tests__/planPermissions.test.ts`
- `src/utils/__tests__/roiBanda.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
