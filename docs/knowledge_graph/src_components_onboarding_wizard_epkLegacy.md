---
id: src_components_onboarding_wizard_epkLegacy
title: "src/components/onboarding/wizard/epkLegacy.ts"
layer: frontend
domain: epk
file: "src/components/onboarding/wizard/epkLegacy.ts"
tags: ["frontend", "epk", "auto"]
---

# 📌 src/components/onboarding/wizard/epkLegacy.ts

> **Ubicación:** `src/components/onboarding/wizard/epkLegacy.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/epk`

## 📖 Descripción
Campos que el asistente guarda en el EPK y que aún no figuran en el tipo `EPKConfig`.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_onboarding_OnboardingWizardModal|src/components/onboarding/OnboardingWizardModal.tsx]] *(from #frontend)*
- [[src_components_onboarding_wizard_hooks_useBookingAndAgentStep|src/components/onboarding/wizard/hooks/useBookingAndAgentStep.ts]] *(from #agent)*
- [[src_components_onboarding_wizard_hooks_useOnboardingWizardController|src/components/onboarding/wizard/hooks/useOnboardingWizardController.ts]] *(from #frontend)*
- [[src_components_onboarding_wizard_hooks_usePhotosStep|src/components/onboarding/wizard/hooks/usePhotosStep.ts]] *(from #frontend)*
- [[src_components_onboarding_wizard_hooks_usePressProofStep|src/components/onboarding/wizard/hooks/usePressProofStep.ts]] *(from #frontend)*
- [[src_components_onboarding_wizard_hooks_useRiderStep|src/components/onboarding/wizard/hooks/useRiderStep.ts]] *(from #frontend)*
- [[src_components_onboarding_wizard_hooks_useSocialsMerchStep|src/components/onboarding/wizard/hooks/useSocialsMerchStep.ts]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/onboarding/wizard/__tests__/onboardingWizardContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
