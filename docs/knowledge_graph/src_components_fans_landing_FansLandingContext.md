---
id: src_components_fans_landing_FansLandingContext
title: "src/components/fans_landing/FansLandingContext.ts"
layer: frontend
domain: social
file: "src/components/fans_landing/FansLandingContext.ts"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/fans_landing/FansLandingContext.ts

> **Ubicación:** `src/components/fans_landing/FansLandingContext.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Contexto de la landing pública de fans: reparte el estado del controlador y las props a las vistas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_FansLanding|src/components/FansLanding.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_fans_landing_hooks_useFansLandingController|src/components/fans_landing/hooks/useFansLandingController.ts]] *(Layer: #frontend, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_fans_landing_AudioPreviewPlayer|src/components/fans_landing/AudioPreviewPlayer.tsx]] *(from #frontend)*
- [[src_components_fans_landing_BookingContactSection|src/components/fans_landing/BookingContactSection.tsx]] *(from #frontend)*
- [[src_components_fans_landing_DonationCard|src/components/fans_landing/DonationCard.tsx]] *(from #frontend)*
- [[src_components_fans_landing_FanIdentityHeader|src/components/fans_landing/FanIdentityHeader.tsx]] *(from #frontend)*
- [[src_components_fans_landing_FansLandingBody|src/components/fans_landing/FansLandingBody.tsx]] *(from #frontend)*
- [[src_components_fans_landing_FansLandingForm|src/components/fans_landing/FansLandingForm.tsx]] *(from #frontend)*
- [[src_components_fans_landing_FansLandingProvider|src/components/fans_landing/FansLandingProvider.tsx]] *(from #frontend)*
- [[src_components_fans_landing_FansLandingSuccess|src/components/fans_landing/FansLandingSuccess.tsx]] *(from #frontend)*
- [[src_components_fans_landing_LandingTabSwitcher|src/components/fans_landing/LandingTabSwitcher.tsx]] *(from #frontend)*
- [[src_components_fans_landing_MusiciansBanner|src/components/fans_landing/MusiciansBanner.tsx]] *(from #frontend)*
- [[src_components_fans_landing_PrivacyPolicyModal|src/components/fans_landing/PrivacyPolicyModal.tsx]] *(from #frontend)*
- [[src_components_fans_landing_SignupFormTab|src/components/fans_landing/SignupFormTab.tsx]] *(from #frontend)*
- [[src_components_fans_landing_SocialLinksTab|src/components/fans_landing/SocialLinksTab.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/fans_landing/__tests__/fansLandingContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
