---
id: src_utils_rellenarFila
title: "src/utils/rellenarFila.ts"
layer: service
domain: system
file: "src/utils/rellenarFila.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/rellenarFila.ts

> **Ubicación:** `src/utils/rellenarFila.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Rejilla de 12 columnas: el último widget de cada fila se estira hasta el borde para no dejar huecos.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_dashboard_DashboardWidgetGrid|src/components/dashboard/DashboardWidgetGrid.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/rellenarFila.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
