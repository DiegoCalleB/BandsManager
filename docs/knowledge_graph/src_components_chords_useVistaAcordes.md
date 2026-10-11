---
id: src_components_chords_useVistaAcordes
title: "src/components/chords/useVistaAcordes.ts"
layer: frontend
domain: repertoire
file: "src/components/chords/useVistaAcordes.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/chords/useVistaAcordes.ts

> **Ubicación:** `src/components/chords/useVistaAcordes.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Instrumento con el que se dibujan los acordes (guitarra / piano / bajo) y sus etiquetas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_instrumentoProfesor|src/utils/instrumentoProfesor.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_vistaAcordes|src/utils/vistaAcordes.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_atril_hooks_useAtrilState|src/components/atril/hooks/useAtrilState.ts]] *(from #frontend)*
- [[src_components_chords_AcordeEnInstrumento|src/components/chords/AcordeEnInstrumento.tsx]] *(from #frontend)*
- [[src_components_ensayos_ModoLocalEnVivoTab|src/components/ensayos/ModoLocalEnVivoTab.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
