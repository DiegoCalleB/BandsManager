---
id: src_utils_acordeEnHermanos
title: "src/utils/acordeEnHermanos.ts"
layer: service
domain: system
file: "src/utils/acordeEnHermanos.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/acordeEnHermanos.ts

> **Ubicación:** `src/utils/acordeEnHermanos.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: AcordePuesto, RangoAcorde, compasesHermanos, ponerAcordeEnHermanos.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cuadriculaCompases|src/utils/cuadriculaCompases.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_lineaTiempoAcordes|src/utils/lineaTiempoAcordes.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_atril_AtrilCompases|src/components/atril/AtrilCompases.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/acordeEnHermanos.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
