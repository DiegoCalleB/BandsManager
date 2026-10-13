---
id: src_utils_panelWidgets
title: "src/utils/panelWidgets.ts"
layer: service
domain: system
file: "src/utils/panelWidgets.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/panelWidgets.ts

> **Ubicación:** `src/utils/panelWidgets.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: moverEntreVisibles, PanelGuardado, TIPOS_RETIRADOS, ESENCIALES_MOVIL, visibleEnMovil, leerPanel, panelDeBanda, conPanel.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types_dashboardWidgets|src/types/dashboardWidgets.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_dashboard_DashboardWidgetGrid|src/components/dashboard/DashboardWidgetGrid.tsx]] *(from #frontend)*
- [[src_components_dashboard_hooks_useGuardadoPanel|src/components/dashboard/hooks/useGuardadoPanel.ts]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/dashboard/hooks/__tests__/useGuardadoPanel.test.tsx`
- `src/utils/__tests__/panelWidgets.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
