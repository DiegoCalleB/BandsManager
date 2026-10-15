---
id: src_components_onboarding_wizard_WizardStepsLate
title: "src/components/onboarding/wizard/WizardStepsLate.tsx"
layer: frontend
domain: system
file: "src/components/onboarding/wizard/WizardStepsLate.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/onboarding/wizard/WizardStepsLate.tsx

> **Ubicación:** `src/components/onboarding/wizard/WizardStepsLate.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Pasos 7 a 13 del asistente (rider, prensa, booking, agente, eventos, fotos, fans) y la celebración final.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_onboarding_steps_StepAgentEmail|src/components/onboarding/steps/StepAgentEmail.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_components_onboarding_steps_StepBookingConditions|src/components/onboarding/steps/StepBookingConditions.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_onboarding_steps_StepCompletedCelebration|src/components/onboarding/steps/StepCompletedCelebration.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_steps_StepEvents|src/components/onboarding/steps/StepEvents.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_steps_StepFansPayments|src/components/onboarding/steps/StepFansPayments.tsx]] *(Layer: #frontend, Domain: #finances)*
- [[src_components_onboarding_steps_StepPhotos|src/components/onboarding/steps/StepPhotos.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_steps_StepPressProof|src/components/onboarding/steps/StepPressProof.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_steps_StepRider|src/components/onboarding/steps/StepRider.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_onboarding_wizard_OnboardingWizardContext|src/components/onboarding/wizard/OnboardingWizardContext.ts]] *(Layer: #frontend, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_onboarding_wizard_OnboardingWizardView|src/components/onboarding/wizard/OnboardingWizardView.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
