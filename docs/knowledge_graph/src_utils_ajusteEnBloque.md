---
id: src_utils_ajusteEnBloque
title: "src/utils/ajusteEnBloque.ts"
layer: service
domain: system
file: "src/utils/ajusteEnBloque.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/ajusteEnBloque.ts

> **Ubicación:** `src/utils/ajusteEnBloque.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: Movimiento, RangoTiempo, movimientoHecho, cambiosHermanos, moverHermanos.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_lineaTiempoAcordes|src/utils/lineaTiempoAcordes.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_atril_AtrilCompases|src/components/atril/AtrilCompases.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/ajusteEnBloque.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
