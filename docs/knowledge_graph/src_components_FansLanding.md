---
id: src_components_FansLanding
title: "src/components/FansLanding.tsx"
layer: frontend
domain: social
file: "src/components/FansLanding.tsx"
tags: ["frontend", "social", "auto", "pantalla"]
---

# 📌 src/components/FansLanding.tsx

> **Ubicación:** `src/components/FansLanding.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Landing pública de fans ("Únete"): redes, conciertos, donaciones y formulario de alta.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_fans_landing_FansLandingForm|src/components/fans_landing/FansLandingForm.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_fans_landing_FansLandingProvider|src/components/fans_landing/FansLandingProvider.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_fans_landing_FansLandingSuccess|src/components/fans_landing/FansLandingSuccess.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_fans_landing_hooks_useFansLandingController|src/components/fans_landing/hooks/useFansLandingController.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_i18n_fansTranslations|src/i18n/fansTranslations.ts]] *(Layer: #service, Domain: #social)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_fans_epk|Fans y EPK]] *(from #feature)*
- [[src_App|src/App.tsx]] *(from #frontend)*
- [[src_components_fans_landing_FansLandingContext|src/components/fans_landing/FansLandingContext.ts]] *(from #frontend)*
- [[src_components_FansLandingPreviewModal|src/components/FansLandingPreviewModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
