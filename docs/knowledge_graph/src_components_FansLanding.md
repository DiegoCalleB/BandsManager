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
Exporta: FansLandingProps, FansLanding.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(Layer: #route, Domain: #epk)*
- [[src_components_SocialPlatformsList|src/components/SocialPlatformsList.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_hooks_useFanFormLanguage|src/hooks/useFanFormLanguage.ts]] *(Layer: #hook, Domain: #social)*
- [[src_i18n_fansTranslations|src/i18n/fansTranslations.ts]] *(Layer: #service, Domain: #social)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_bandHash|src/utils/bandHash.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_fanUtils|src/utils/fanUtils.ts]] *(Layer: #service, Domain: #social)*
- [[src_utils_richText|src/utils/richText.tsx]] *(Layer: #service, Domain: #system)*
- [[src_utils_safeUrl|src/utils/safeUrl.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_whatsapp|src/utils/whatsapp.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_fans_epk|Fans y EPK]] *(from #feature)*
- [[src_App|src/App.tsx]] *(from #frontend)*
- [[src_components_FansLandingPreviewModal|src/components/FansLandingPreviewModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
