---
id: src_utils_theme
title: "src/utils/theme.ts"
layer: service
domain: system
file: "src/utils/theme.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/theme.ts

> **Ubicación:** `src/utils/theme.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: getEspectroColors, THEMES.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_hooks_useAppTheme|src/app/hooks/useAppTheme.ts]] *(from #service)*
- [[src_components_fans_panel_FansPanelBody|src/components/fans_panel/FansPanelBody.tsx]] *(from #frontend)*
- [[src_components_user_profile_AppearanceSettings|src/components/user_profile/AppearanceSettings.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
