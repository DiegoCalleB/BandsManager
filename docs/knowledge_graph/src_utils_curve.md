---
id: src_utils_curve
title: "src/utils/curve.ts"
layer: service
domain: system
file: "src/utils/curve.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/curve.ts

> **Ubicación:** `src/utils/curve.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Curva suave que nunca sobrepasa los datos (interpolación monótona, Fritsch–Carlson).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_EnergyChart|src/components/repertorio/EnergyChart.tsx]] *(from #frontend)*
- [[src_components_ui_CurveSeries|src/components/ui/CurveSeries.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
