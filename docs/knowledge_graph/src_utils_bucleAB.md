---
id: src_utils_bucleAB
title: "src/utils/bucleAB.ts"
layer: service
domain: system
file: "src/utils/bucleAB.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/bucleAB.ts

> **Ubicación:** `src/utils/bucleAB.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Bucle A/B de una pieza, en segundos. Compartido por el Atril y el panel de práctica.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_chords_ControlBucle|src/components/chords/ControlBucle.tsx]] *(from #frontend)*
- [[src_components_PracticeModePanel|src/components/PracticeModePanel.tsx]] *(from #frontend)*
- [[src_hooks_useBucleAB|src/hooks/useBucleAB.ts]] *(from #hook)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
