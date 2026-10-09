---
id: src_components_onboarding_OnboardingWizardModal
title: "src/components/onboarding/OnboardingWizardModal.tsx"
layer: frontend
domain: system
file: "src/components/onboarding/OnboardingWizardModal.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/onboarding/OnboardingWizardModal.tsx

> **Ubicación:** `src/components/onboarding/OnboardingWizardModal.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: OnboardingWizardModalProps, OnboardingWizardModal.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_spotify|server/routes/spotify.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_common_ModalPortal|src/components/common/ModalPortal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_steps_StepAgentEmail|src/components/onboarding/steps/StepAgentEmail.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_components_onboarding_steps_StepBio|src/components/onboarding/steps/StepBio.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_steps_StepBookingConditions|src/components/onboarding/steps/StepBookingConditions.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_onboarding_steps_StepCompletedCelebration|src/components/onboarding/steps/StepCompletedCelebration.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_steps_StepEvents|src/components/onboarding/steps/StepEvents.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_steps_StepFansPayments|src/components/onboarding/steps/StepFansPayments.tsx]] *(Layer: #frontend, Domain: #finances)*
- [[src_components_onboarding_steps_StepIdentity|src/components/onboarding/steps/StepIdentity.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_steps_StepLanguage|src/components/onboarding/steps/StepLanguage.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_steps_StepMembers|src/components/onboarding/steps/StepMembers.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_steps_StepMusicSetlist|src/components/onboarding/steps/StepMusicSetlist.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_onboarding_steps_StepPhotos|src/components/onboarding/steps/StepPhotos.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_steps_StepPressProof|src/components/onboarding/steps/StepPressProof.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_steps_StepRider|src/components/onboarding/steps/StepRider.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_steps_StepSocialsMerch|src/components/onboarding/steps/StepSocialsMerch.tsx]] *(Layer: #frontend, Domain: #finances)*
- [[src_components_onboarding_steps_StepVideos|src/components/onboarding/steps/StepVideos.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_types|src/components/onboarding/types.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_planPermissions|src/utils/planPermissions.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_userPreferences|src/utils/userPreferences.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_App|src/App.tsx]] *(from #frontend)*
- [[src_components_onboarding_index|src/components/onboarding/index.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
