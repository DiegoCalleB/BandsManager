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
- [[src_App|src/App.tsx]] *(from #frontend)*
- [[src_components_BandSwitcherModal|src/components/BandSwitcherModal.tsx]] *(from #frontend)*
- [[src_components_calendar_CalendarSidebarLogistics|src/components/calendar/CalendarSidebarLogistics.tsx]] *(from #frontend)*
- [[src_components_CalendarView|src/components/CalendarView.tsx]] *(from #frontend)*
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

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
