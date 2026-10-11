---
id: src_components_BandSwitcherModal
title: "src/components/BandSwitcherModal.tsx"
layer: frontend
domain: system
file: "src/components/BandSwitcherModal.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/BandSwitcherModal.tsx

> **Ubicación:** `src/components/BandSwitcherModal.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Selector de bandas del usuario: cambiar, ordenar, fijar principal, salir y crear.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_band_switcher_BandSwitcherLayout|src/components/band_switcher/BandSwitcherLayout.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_band_switcher_BandSwitcherProvider|src/components/band_switcher/BandSwitcherProvider.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_band_switcher_bandSwitcherTypes|src/components/band_switcher/bandSwitcherTypes.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_band_switcher_hooks_useBandSwitcherController|src/components/band_switcher/hooks/useBandSwitcherController.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_lazyViews|src/app/lazyViews.ts]] *(from #service)*
- [[src_components_band_switcher_BandSwitcherContext|src/components/band_switcher/BandSwitcherContext.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
