---
id: src_components_fans_landing_hooks_useFansLandingController
title: "src/components/fans_landing/hooks/useFansLandingController.ts"
layer: frontend
domain: social
file: "src/components/fans_landing/hooks/useFansLandingController.ts"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/fans_landing/hooks/useFansLandingController.ts

> **Ubicación:** `src/components/fans_landing/hooks/useFansLandingController.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Controlador de la landing pública de fans: idioma, formulario, perfil de banda, pagos y reproducción.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_fans_landing_hooks_useAudioPreview|src/components/fans_landing/hooks/useAudioPreview.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_fans_landing_hooks_useFanBandProfile|src/components/fans_landing/hooks/useFanBandProfile.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_fans_landing_hooks_useFanEngagement|src/components/fans_landing/hooks/useFanEngagement.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_fans_landing_hooks_useFanJoinForm|src/components/fans_landing/hooks/useFanJoinForm.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_fans_landing_hooks_useFanLanguage|src/components/fans_landing/hooks/useFanLanguage.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_fans_landing_hooks_useFanPayments|src/components/fans_landing/hooks/useFanPayments.ts]] *(Layer: #frontend, Domain: #finances)*
- [[src_components_fans_landing_hooks_useFanSignupSubmit|src/components/fans_landing/hooks/useFanSignupSubmit.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_i18n_fansTranslations|src/i18n/fansTranslations.ts]] *(Layer: #service, Domain: #social)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_fans_landing_FansLandingContext|src/components/fans_landing/FansLandingContext.ts]] *(from #frontend)*
- [[src_components_FansLanding|src/components/FansLanding.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
