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
Asistente de configuración inicial de la banda (EPK, repertorio, eventos, condiciones de booking).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_onboarding_wizard_OnboardingWizardProvider|src/components/onboarding/wizard/OnboardingWizardProvider.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_wizard_OnboardingWizardView|src/components/onboarding/wizard/OnboardingWizardView.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_wizard_epkLegacy|src/components/onboarding/wizard/epkLegacy.ts]] *(Layer: #frontend, Domain: #epk)*
- [[src_components_onboarding_wizard_hooks_useOnboardingWizardController|src/components/onboarding/wizard/hooks/useOnboardingWizardController.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_lazyViews|src/app/lazyViews.ts]] *(from #service)*
- [[src_components_onboarding_index|src/components/onboarding/index.ts]] *(from #frontend)*
- [[src_components_onboarding_wizard_hooks_useOnboardingWizardController|src/components/onboarding/wizard/hooks/useOnboardingWizardController.ts]] *(from #frontend)*
- [[src_components_onboarding_wizard_OnboardingWizardContext|src/components/onboarding/wizard/OnboardingWizardContext.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
