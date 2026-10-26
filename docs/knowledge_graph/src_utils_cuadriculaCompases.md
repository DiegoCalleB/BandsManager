---
id: src_utils_cuadriculaCompases
title: "src/utils/cuadriculaCompases.ts"
layer: service
domain: system
file: "src/utils/cuadriculaCompases.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/cuadriculaCompases.ts

> **Ubicación:** `src/utils/cuadriculaCompases.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: Compas, Bloque, Cuadricula, MotivoSinCuadricula, AjusteCompases, ResultadoCuadricula, PosicionEnCuadricula, construirCuadricula.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_atril_AjusteCompases|src/components/atril/AjusteCompases.tsx]] *(from #frontend)*
- [[src_components_atril_AtrilCompases|src/components/atril/AtrilCompases.tsx]] *(from #frontend)*
- [[src_components_chords_LineaTiempoAcordes|src/components/chords/LineaTiempoAcordes.tsx]] *(from #frontend)*
- [[src_components_chords_PanelArmonia|src/components/chords/PanelArmonia.tsx]] *(from #frontend)*
- [[src_components_chords_RegletaCompases|src/components/chords/RegletaCompases.tsx]] *(from #frontend)*
- [[src_components_chords_useVistaAcordes|src/components/chords/useVistaAcordes.ts]] *(from #frontend)*
- [[src_components_chords_VistaCompases|src/components/chords/VistaCompases.tsx]] *(from #frontend)*
- [[src_utils_ajusteCompases|src/utils/ajusteCompases.ts]] *(from #service)*
- [[src_utils_vistaCompases|src/utils/vistaCompases.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/audit/vistaCompases.test.tsx`
- `src/utils/__tests__/ajusteCompases.test.ts`
- `src/utils/__tests__/cuadriculaCompases.test.ts`
- `src/utils/__tests__/vistaCompases.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
