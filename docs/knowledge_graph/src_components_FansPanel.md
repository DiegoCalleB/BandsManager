---
id: src_components_FansPanel
title: "src/components/FansPanel.tsx"
layer: frontend
domain: social
file: "src/components/FansPanel.tsx"
tags: ["frontend", "social", "auto", "pantalla"]
---

# 📌 src/components/FansPanel.tsx

> **Ubicación:** `src/components/FansPanel.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Panel de fans: métricas, listado, QR de la landing, incentivos y alta manual.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_fans_panel_FansPanelBody|src/components/fans_panel/FansPanelBody.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_fans_panel_FansPanelProvider|src/components/fans_panel/FansPanelProvider.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_fans_panel_hooks_useFansPanelController|src/components/fans_panel/hooks/useFansPanelController.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_fans_epk|Fans y EPK]] *(from #feature)*
- [[src_App|src/App.tsx]] *(from #frontend)*
- [[src_components_fans_panel_FansPanelContext|src/components/fans_panel/FansPanelContext.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
