---
id: src_utils_roiBanda
title: "src/utils/roiBanda.ts"
layer: service
domain: system
file: "src/utils/roiBanda.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/roiBanda.ts

> **Ubicación:** `src/utils/roiBanda.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
«Lo que ha cobrado tu banda frente a lo que cuesta tu plan». Lógica pura, sin I/O.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_planPermissions|src/utils/planPermissions.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_dashboard_widgets_RoiBandaWidget|src/components/dashboard/widgets/RoiBandaWidget.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
