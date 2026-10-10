---
id: src_utils_lineaTiempoAcordes
title: "src/utils/lineaTiempoAcordes.ts"
layer: service
domain: system
file: "src/utils/lineaTiempoAcordes.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/lineaTiempoAcordes.ts

> **Ubicación:** `src/utils/lineaTiempoAcordes.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: indiceSegmentoEn, siguienteAcordeReal, RangoBucle, rangoBucle, saltoDeBucle, corregirAcorde, TRAMO_MINIMO, partirTramo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*
- [[src_components_atril_hooks_useAtrilHarmony|src/components/atril/hooks/useAtrilHarmony.ts]] *(from #frontend)*
- [[src_components_chords_LineaTiempoAcordes|src/components/chords/LineaTiempoAcordes.tsx]] *(from #frontend)*
- [[src_utils_alineacionAcordes|src/utils/alineacionAcordes.ts]] *(from #service)*
- [[src_utils_armoniaVisor|src/utils/armoniaVisor.ts]] *(from #service)*
- [[src_utils_vistaAcordes|src/utils/vistaAcordes.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/lineaTiempoAcordes.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
