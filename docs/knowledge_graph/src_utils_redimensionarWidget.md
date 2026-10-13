---
id: src_utils_redimensionarWidget
title: "src/utils/redimensionarWidget.ts"
layer: service
domain: system
file: "src/utils/redimensionarWidget.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/redimensionarWidget.ts

> **Ubicación:** `src/utils/redimensionarWidget.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Tamaños de un widget y cómo salen de un arrastre o de una tecla. Todo puro, sin DOM.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_dashboard_ControlesTamano|src/components/dashboard/ControlesTamano.tsx]] *(from #frontend)*
- [[src_components_dashboard_DashboardWidgetGrid|src/components/dashboard/DashboardWidgetGrid.tsx]] *(from #frontend)*
- [[src_components_dashboard_hooks_useRedimensionar|src/components/dashboard/hooks/useRedimensionar.ts]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/redimensionarWidget.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
