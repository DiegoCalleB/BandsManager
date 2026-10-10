---
id: src_components_PublicMusiciansLanding
title: "src/components/PublicMusiciansLanding.tsx"
layer: frontend
domain: system
file: "src/components/PublicMusiciansLanding.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/PublicMusiciansLanding.tsx

> **Ubicación:** `src/components/PublicMusiciansLanding.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: PublicMusiciansLanding.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(Layer: #route, Domain: #epk)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_i18n_fansTranslations|src/i18n/fansTranslations.ts]] *(Layer: #service, Domain: #social)*
- [[src_i18n_musiciansTranslations|src/i18n/musiciansTranslations.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_lazyViews|src/app/lazyViews.ts]] *(from #service)*
- [[src_main|src/main.tsx]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
