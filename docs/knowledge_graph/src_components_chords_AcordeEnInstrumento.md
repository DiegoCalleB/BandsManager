---
id: src_components_chords_AcordeEnInstrumento
title: "src/components/chords/AcordeEnInstrumento.tsx"
layer: frontend
domain: repertoire
file: "src/components/chords/AcordeEnInstrumento.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/chords/AcordeEnInstrumento.tsx

> **Ubicación:** `src/components/chords/AcordeEnInstrumento.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: TecladoAcorde, BajoAcorde, ETIQUETA_VISTA, SelectorVistaAcorde, useVistaAcordes, CajaAcorde.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_chordUtils|src/utils/chordUtils.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_estiloArmonia|src/utils/estiloArmonia.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_instrumentoProfesor|src/utils/instrumentoProfesor.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_vistaAcordes|src/utils/vistaAcordes.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Atril|src/components/Atril.tsx]] *(from #frontend)*
- [[src_components_chords_DrawerDiagramas|src/components/chords/DrawerDiagramas.tsx]] *(from #frontend)*
- [[src_components_ensayos_ModoLocalEnVivoTab|src/components/ensayos/ModoLocalEnVivoTab.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
