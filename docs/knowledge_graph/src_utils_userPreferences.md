---
id: src_utils_userPreferences
title: "src/utils/userPreferences.ts"
layer: service
domain: system
file: "src/utils/userPreferences.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/userPreferences.ts

> **Ubicación:** `src/utils/userPreferences.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: TUTORIAL_STORAGE_PREFIX, ONBOARDING_GLOBAL_KEY, PROFILE_WIZARD_GLOBAL_KEY, cleanBandKey, syncAllUserPreferencesFromUser, isTutorialSeen, markTutorialSeen, isOnboardingCompleted.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_calendarViewPreferences|src/utils/calendarViewPreferences.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_hooks_useActiveBand|src/app/hooks/useActiveBand.ts]] *(from #service)*
- [[src_components_onboarding_MusicianOnboardingModal|src/components/onboarding/MusicianOnboardingModal.tsx]] *(from #frontend)*
- [[src_components_onboarding_wizard_hooks_useOnboardingWizardController|src/components/onboarding/wizard/hooks/useOnboardingWizardController.ts]] *(from #frontend)*
- [[src_hooks_useAuth|src/hooks/useAuth.ts]] *(from #security)*
- [[src_hooks_useModuleTutorial|src/hooks/useModuleTutorial.ts]] *(from #hook)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
