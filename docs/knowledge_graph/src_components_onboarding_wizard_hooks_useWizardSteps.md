---
id: src_components_onboarding_wizard_hooks_useWizardSteps
title: "src/components/onboarding/wizard/hooks/useWizardSteps.ts"
layer: frontend
domain: system
file: "src/components/onboarding/wizard/hooks/useWizardSteps.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/onboarding/wizard/hooks/useWizardSteps.ts

> **Ubicación:** `src/components/onboarding/wizard/hooks/useWizardSteps.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Pasos del asistente según el plan (idioma, identidad, bio…) y paso actual.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_onboarding_types|src/components/onboarding/types.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_planPermissions|src/utils/planPermissions.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_onboarding_wizard_hooks_useOnboardingWizardController|src/components/onboarding/wizard/hooks/useOnboardingWizardController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
