---
id: src_app_lazyViews
title: "src/app/lazyViews.ts"
layer: service
domain: system
file: "src/app/lazyViews.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/app/lazyViews.ts

> **Ubicación:** `src/app/lazyViews.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Vistas y modales cargados bajo demanda, con reintento si falla la carga del módulo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_BandCRM|src/components/BandCRM.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_BandSwitcherModal|src/components/BandSwitcherModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_CalendarView|src/components/CalendarView.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_Chatbot|src/components/Chatbot.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_EPKManager|src/components/EPKManager.tsx]] *(Layer: #frontend, Domain: #epk)*
- [[src_components_FansLanding|src/components/FansLanding.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_FansPanel|src/components/FansPanel.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_Finanzas|src/components/Finanzas.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_FontSelectorModal|src/components/FontSelectorModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_LoginModal|src/components/LoginModal.tsx]] *(Layer: #frontend, Domain: #auth)*
- [[src_components_Merchan|src/components/Merchan.tsx]] *(Layer: #frontend, Domain: #finances)*
- [[src_components_PlanLimitModal|src/components/PlanLimitModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_Planes|src/components/Planes.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_PublicEPK|src/components/PublicEPK.tsx]] *(Layer: #frontend, Domain: #epk)*
- [[src_components_PublicLanding|src/components/PublicLanding.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_PublicMusiciansLanding|src/components/PublicMusiciansLanding.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_PublicTfmLanding|src/components/PublicTfmLanding.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ReelsCenter|src/components/ReelsCenter.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_SimplePromoLoginModal|src/components/SimplePromoLoginModal.tsx]] *(Layer: #frontend, Domain: #auth)*
- [[src_components_SongStudioModal|src/components/SongStudioModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_TourManager|src/components/TourManager.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_UserManagementModal|src/components/UserManagementModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_UserProfileModal|src/components/UserProfileModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_campaign_CampaignManagerModal|src/components/campaign/CampaignManagerModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ensayos_EnsayosManager|src/components/ensayos/EnsayosManager.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_notifications_NotificationSettingsModal|src/components/notifications/NotificationSettingsModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_MusicianOnboardingModal|src/components/onboarding/MusicianOnboardingModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_OnboardingWizardModal|src/components/onboarding/OnboardingWizardModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_pages_PublicDealView|src/pages/PublicDealView.tsx]] *(Layer: #frontend, Domain: #system)*
- [[ui_booking_crm|Booking CRM Component]] *(Layer: #frontend, Domain: #booking)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(Layer: #frontend, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_ActiveViewRouter|src/app/ActiveViewRouter.tsx]] *(from #service)*
- [[src_app_AppGate|src/app/AppGate.tsx]] *(from #service)*
- [[src_app_AppModalsHost|src/app/AppModalsHost.tsx]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
