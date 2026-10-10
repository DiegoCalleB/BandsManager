---
id: src_components_fans_panel_hooks_useQrLink
title: "src/components/fans_panel/hooks/useQrLink.ts"
layer: frontend
domain: social
file: "src/components/fans_panel/hooks/useQrLink.ts"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/fans_panel/hooks/useQrLink.ts

> **Ubicación:** `src/components/fans_panel/hooks/useQrLink.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Concierto seleccionado, dominio, ruta e idioma del enlace del QR.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_i18n_fansTranslations|src/i18n/fansTranslations.ts]] *(Layer: #service, Domain: #social)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_bandHash|src/utils/bandHash.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_fans_panel_hooks_useFansPanelController|src/components/fans_panel/hooks/useFansPanelController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
