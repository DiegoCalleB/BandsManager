---
id: src_components_dashboard_widgets_ChartWidgets
title: "src/components/dashboard/widgets/ChartWidgets.tsx"
layer: frontend
domain: system
file: "src/components/dashboard/widgets/ChartWidgets.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/dashboard/widgets/ChartWidgets.tsx

> **Ubicación:** `src/components/dashboard/widgets/ChartWidgets.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: ChartWidgetProps, RepertorioEnergyChartWidget, BookingFunnelChartWidget, FinancesChartWidget, SocialFansGrowthWidget.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_dashboard_widgets_EnergyCurve|src/components/dashboard/widgets/EnergyCurve.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_CurveSeries|src/components/ui/CurveSeries.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_Onda|src/components/ui/Onda.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_energyPacingUtils|src/utils/energyPacingUtils.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_dashboard_DashboardWidgetGrid|src/components/dashboard/DashboardWidgetGrid.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
