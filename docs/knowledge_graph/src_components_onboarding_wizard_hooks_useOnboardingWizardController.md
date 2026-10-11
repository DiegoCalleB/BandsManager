---
id: src_components_onboarding_wizard_hooks_useOnboardingWizardController
title: "src/components/onboarding/wizard/hooks/useOnboardingWizardController.ts"
layer: frontend
domain: system
file: "src/components/onboarding/wizard/hooks/useOnboardingWizardController.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/onboarding/wizard/hooks/useOnboardingWizardController.ts

> **Ubicación:** `src/components/onboarding/wizard/hooks/useOnboardingWizardController.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: useOnboardingWizardController.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_onboarding_OnboardingWizardModal|src/components/onboarding/OnboardingWizardModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_types|src/components/onboarding/types.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_wizard_epkLegacy|src/components/onboarding/wizard/epkLegacy.ts]] *(Layer: #frontend, Domain: #epk)*
- [[src_components_onboarding_wizard_hooks_useBioStep|src/components/onboarding/wizard/hooks/useBioStep.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_wizard_hooks_useBookingAndAgentStep|src/components/onboarding/wizard/hooks/useBookingAndAgentStep.ts]] *(Layer: #agent, Domain: #booking)*
- [[src_components_onboarding_wizard_hooks_useEventsStep|src/components/onboarding/wizard/hooks/useEventsStep.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_wizard_hooks_useFansPaymentsStep|src/components/onboarding/wizard/hooks/useFansPaymentsStep.ts]] *(Layer: #frontend, Domain: #finances)*
- [[src_components_onboarding_wizard_hooks_useIdentityStep|src/components/onboarding/wizard/hooks/useIdentityStep.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_wizard_hooks_useMembersStep|src/components/onboarding/wizard/hooks/useMembersStep.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_wizard_hooks_useMusicSetlistStep|src/components/onboarding/wizard/hooks/useMusicSetlistStep.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_onboarding_wizard_hooks_usePhotosStep|src/components/onboarding/wizard/hooks/usePhotosStep.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_wizard_hooks_usePressProofStep|src/components/onboarding/wizard/hooks/usePressProofStep.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_wizard_hooks_useRiderStep|src/components/onboarding/wizard/hooks/useRiderStep.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_wizard_hooks_useSocialsMerchStep|src/components/onboarding/wizard/hooks/useSocialsMerchStep.ts]] *(Layer: #frontend, Domain: #finances)*
- [[src_components_onboarding_wizard_hooks_useVideosStep|src/components/onboarding/wizard/hooks/useVideosStep.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_wizard_hooks_useWizardSteps|src/components/onboarding/wizard/hooks/useWizardSteps.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_userPreferences|src/utils/userPreferences.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_onboarding_OnboardingWizardModal|src/components/onboarding/OnboardingWizardModal.tsx]] *(from #frontend)*
- [[src_components_onboarding_wizard_OnboardingWizardContext|src/components/onboarding/wizard/OnboardingWizardContext.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
