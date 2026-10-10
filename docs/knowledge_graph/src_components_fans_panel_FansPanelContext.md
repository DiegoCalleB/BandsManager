---
id: src_components_fans_panel_FansPanelContext
title: "src/components/fans_panel/FansPanelContext.ts"
layer: frontend
domain: social
file: "src/components/fans_panel/FansPanelContext.ts"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/fans_panel/FansPanelContext.ts

> **Ubicación:** `src/components/fans_panel/FansPanelContext.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Contexto del panel de fans: reparte el estado del controlador y las props a las vistas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_FansPanel|src/components/FansPanel.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_fans_panel_hooks_useFansPanelController|src/components/fans_panel/hooks/useFansPanelController.ts]] *(Layer: #frontend, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_fans_panel_FansAddModal|src/components/fans_panel/FansAddModal.tsx]] *(from #frontend)*
- [[src_components_fans_panel_FansCityTabsBar|src/components/fans_panel/FansCityTabsBar.tsx]] *(from #frontend)*
- [[src_components_fans_panel_FansGridView|src/components/fans_panel/FansGridView.tsx]] *(from #frontend)*
- [[src_components_fans_panel_FansListTab|src/components/fans_panel/FansListTab.tsx]] *(from #frontend)*
- [[src_components_fans_panel_FansMapView|src/components/fans_panel/FansMapView.tsx]] *(from #frontend)*
- [[src_components_fans_panel_FansPanelBody|src/components/fans_panel/FansPanelBody.tsx]] *(from #frontend)*
- [[src_components_fans_panel_FansPanelHeader|src/components/fans_panel/FansPanelHeader.tsx]] *(from #frontend)*
- [[src_components_fans_panel_FansPanelProvider|src/components/fans_panel/FansPanelProvider.tsx]] *(from #frontend)*
- [[src_components_fans_panel_FansQrTab|src/components/fans_panel/FansQrTab.tsx]] *(from #frontend)*
- [[src_components_fans_panel_FansTableView|src/components/fans_panel/FansTableView.tsx]] *(from #frontend)*
- [[src_components_fans_panel_FansToolbar|src/components/fans_panel/FansToolbar.tsx]] *(from #frontend)*
- [[src_components_fans_panel_QrAdvancedConfig|src/components/fans_panel/QrAdvancedConfig.tsx]] *(from #frontend)*
- [[src_components_fans_panel_QrPreviewCard|src/components/fans_panel/QrPreviewCard.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/fans_panel/__tests__/fansPanelContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
