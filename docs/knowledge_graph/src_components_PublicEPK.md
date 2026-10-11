---
id: src_components_PublicEPK
title: "src/components/PublicEPK.tsx"
layer: frontend
domain: epk
file: "src/components/PublicEPK.tsx"
tags: ["frontend", "epk", "auto"]
---

# 📌 src/components/PublicEPK.tsx

> **Ubicación:** `src/components/PublicEPK.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/epk`

## 📖 Descripción
Exporta: PublicEPK.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(Layer: #route, Domain: #epk)*
- [[src_components_SocialPlatformsList|src/components/SocialPlatformsList.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_epk_epkTemplates|src/components/epk/epkTemplates.ts]] *(Layer: #frontend, Domain: #epk)*
- [[src_components_ui_InsigniaBandManager|src/components/ui/InsigniaBandManager.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_config_bandFonts|src/config/bandFonts.ts]] *(Layer: #service, Domain: #system)*
- [[src_hooks_useEpkLanguage|src/hooks/useEpkLanguage.ts]] *(Layer: #hook, Domain: #epk)*
- [[src_i18n_epkTranslations|src/i18n/epkTranslations.ts]] *(Layer: #service, Domain: #epk)*
- [[src_i18n_fansTranslations|src/i18n/fansTranslations.ts]] *(Layer: #service, Domain: #social)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_epkTraducciones|src/utils/epkTraducciones.ts]] *(Layer: #service, Domain: #epk)*
- [[src_utils_safeUrl|src/utils/safeUrl.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_fans_epk|Fans y EPK]] *(from #feature)*
- [[src_app_lazyViews|src/app/lazyViews.ts]] *(from #service)*
- [[src_main|src/main.tsx]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
