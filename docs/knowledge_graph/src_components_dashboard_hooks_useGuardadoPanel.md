---
id: src_components_dashboard_hooks_useGuardadoPanel
title: "src/components/dashboard/hooks/useGuardadoPanel.ts"
layer: frontend
domain: system
file: "src/components/dashboard/hooks/useGuardadoPanel.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/dashboard/hooks/useGuardadoPanel.ts

> **Ubicación:** `src/components/dashboard/hooks/useGuardadoPanel.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: ESPERA_GUARDADO_MS, useGuardadoPanel.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_services_sesionLocal|src/services/sesionLocal.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_panelWidgets|src/utils/panelWidgets.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_dashboard_DashboardWidgetGrid|src/components/dashboard/DashboardWidgetGrid.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/dashboard/hooks/__tests__/useGuardadoPanel.test.tsx`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
