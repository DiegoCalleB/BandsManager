---
id: src_context_idioma
title: "src/context/idioma.ts"
layer: service
domain: system
file: "src/context/idioma.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/context/idioma.ts

> **Ubicación:** `src/context/idioma.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: SupportedLanguage, LanguageOption, SUPPORTED_LANGUAGES, LanguageContextType, LanguageContext, useLanguage.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_context_translations_index|src/context/translations/index.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_hooks_useAppController|src/app/hooks/useAppController.ts]] *(from #service)*
- [[src_app_hooks_useAppNavigation|src/app/hooks/useAppNavigation.ts]] *(from #service)*
- [[src_components_finanzas_FinanceSummaryCards|src/components/finanzas/FinanceSummaryCards.tsx]] *(from #frontend)*
- [[src_components_landing_GuiasDestacadas|src/components/landing/GuiasDestacadas.tsx]] *(from #frontend)*
- [[src_components_landing_SeccionAutor|src/components/landing/SeccionAutor.tsx]] *(from #frontend)*
- [[src_components_LandingChatWidget|src/components/LandingChatWidget.tsx]] *(from #frontend)*
- [[src_components_LoginModal|src/components/LoginModal.tsx]] *(from #frontend)*
- [[src_components_onboarding_MusicianOnboardingModal|src/components/onboarding/MusicianOnboardingModal.tsx]] *(from #frontend)*
- [[src_components_onboarding_steps_StepLanguage|src/components/onboarding/steps/StepLanguage.tsx]] *(from #frontend)*
- [[src_components_PublicLanding|src/components/PublicLanding.tsx]] *(from #frontend)*
- [[src_components_PublicTfmLanding|src/components/PublicTfmLanding.tsx]] *(from #frontend)*
- [[src_components_user_profile_hooks_useUserProfileController|src/components/user_profile/hooks/useUserProfileController.ts]] *(from #frontend)*
- [[src_components_user_profile_LanguageSelector|src/components/user_profile/LanguageSelector.tsx]] *(from #frontend)*
- [[src_context_googleTranslate|src/context/googleTranslate.ts]] *(from #service)*
- [[src_context_LanguageContext|src/context/LanguageContext.tsx]] *(from #service)*
- [[src_context_translations_index|src/context/translations/index.ts]] *(from #service)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/context/__tests__/LanguageContext.behavior.test.tsx`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
