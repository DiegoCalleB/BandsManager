---
id: src_utils_chordUtils
title: "src/utils/chordUtils.ts"
layer: service
domain: repertoire
file: "src/utils/chordUtils.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 src/utils/chordUtils.ts

> **Ubicación:** `src/utils/chordUtils.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Utility for chord parsing, transposition, notation conversion, and chord diagrams

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Atril|src/components/Atril.tsx]] *(from #frontend)*
- [[src_components_chords_AcordeEnInstrumento|src/components/chords/AcordeEnInstrumento.tsx]] *(from #frontend)*
- [[src_components_chords_LineaTiempoAcordes|src/components/chords/LineaTiempoAcordes.tsx]] *(from #frontend)*
- [[src_components_chords_PanelArmonia|src/components/chords/PanelArmonia.tsx]] *(from #frontend)*
- [[src_components_ensayos_ModoLocalEnVivoTab|src/components/ensayos/ModoLocalEnVivoTab.tsx]] *(from #frontend)*
- [[src_components_PracticeModePanel|src/components/PracticeModePanel.tsx]] *(from #frontend)*
- [[src_components_SetlistPerformanceView|src/components/SetlistPerformanceView.tsx]] *(from #frontend)*
- [[src_components_SpotifyPlayerBar|src/components/SpotifyPlayerBar.tsx]] *(from #frontend)*
- [[src_hooks_useAcordesDeLaHoja|src/hooks/useAcordesDeLaHoja.ts]] *(from #hook)*
- [[src_utils_vistaAcordes|src/utils/vistaAcordes.ts]] *(from #service)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
