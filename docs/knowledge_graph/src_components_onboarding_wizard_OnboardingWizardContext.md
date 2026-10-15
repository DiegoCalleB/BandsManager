---
id: src_components_onboarding_wizard_OnboardingWizardContext
title: "src/components/onboarding/wizard/OnboardingWizardContext.ts"
layer: frontend
domain: system
file: "src/components/onboarding/wizard/OnboardingWizardContext.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/onboarding/wizard/OnboardingWizardContext.ts

> **Ubicación:** `src/components/onboarding/wizard/OnboardingWizardContext.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Contexto del asistente de configuración inicial: reparte el estado del controlador y las props a las vistas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_onboarding_OnboardingWizardModal|src/components/onboarding/OnboardingWizardModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_wizard_hooks_useOnboardingWizardController|src/components/onboarding/wizard/hooks/useOnboardingWizardController.ts]] *(Layer: #frontend, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_onboarding_wizard_OnboardingWizardProvider|src/components/onboarding/wizard/OnboardingWizardProvider.tsx]] *(from #frontend)*
- [[src_components_onboarding_wizard_WizardFooter|src/components/onboarding/wizard/WizardFooter.tsx]] *(from #frontend)*
- [[src_components_onboarding_wizard_WizardHeader|src/components/onboarding/wizard/WizardHeader.tsx]] *(from #frontend)*
- [[src_components_onboarding_wizard_WizardStepper|src/components/onboarding/wizard/WizardStepper.tsx]] *(from #frontend)*
- [[src_components_onboarding_wizard_WizardStepsEarly|src/components/onboarding/wizard/WizardStepsEarly.tsx]] *(from #frontend)*
- [[src_components_onboarding_wizard_WizardStepsLate|src/components/onboarding/wizard/WizardStepsLate.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/onboarding/wizard/__tests__/onboardingWizardContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
