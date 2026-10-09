---
id: src_components_Atril
title: "src/components/Atril.tsx"
layer: frontend
domain: repertoire
file: "src/components/Atril.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/Atril.tsx

> **Ubicación:** `src/components/Atril.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: AtrilProps, Atril, renderFormattedChordSheet.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[src_components_MetronomeModal|src/components/MetronomeModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ShareModal|src/components/ShareModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_TunerModal|src/components/TunerModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_chords_AcordeEnInstrumento|src/components/chords/AcordeEnInstrumento.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_ControlAutoscroll|src/components/chords/ControlAutoscroll.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_ControlBucle|src/components/chords/ControlBucle.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_ControlMetronomo|src/components/chords/ControlMetronomo.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_ControlTonoAudio|src/components/chords/ControlTonoAudio.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_ControlVelocidad|src/components/chords/ControlVelocidad.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_DrawerDiagramas|src/components/chords/DrawerDiagramas.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_GrabarIdea|src/components/chords/GrabarIdea.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_IrisStudio|src/components/chords/IrisStudio.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_LineaTiempoAcordes|src/components/chords/LineaTiempoAcordes.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_MezclaPistas|src/components/chords/MezclaPistas.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_ModalOido|src/components/chords/ModalOido.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_PanelArmonia|src/components/chords/PanelArmonia.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_ProfesorIA|src/components/chords/ProfesorIA.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_RelojEnAcorde|src/components/chords/RelojEnAcorde.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_SelectorArmonia|src/components/chords/SelectorArmonia.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_SelectorEscucha|src/components/chords/SelectorEscucha.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_TomasConFondo|src/components/chords/TomasConFondo.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_common_ModalPortal|src/components/common/ModalPortal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_song_studio_SongStudioStemProgressModal|src/components/song_studio/SongStudioStemProgressModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioStructureUploadModal|src/components/song_studio/SongStudioStructureUploadModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_hooks_useAcordesDeLaHoja|src/hooks/useAcordesDeLaHoja.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useAutoScroll|src/hooks/useAutoScroll.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useBucleAB|src/hooks/useBucleAB.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useGrabarIdea|src/hooks/useGrabarIdea.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useMetronomo|src/hooks/useMetronomo.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useMezclaGuardada|src/hooks/useMezclaGuardada.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useMezclaStems|src/hooks/useMezclaStems.ts]] *(Layer: #hook, Domain: #repertoire)*
- [[src_hooks_useSeparacionIris|src/hooks/useSeparacionIris.ts]] *(Layer: #hook, Domain: #repertoire)*
- [[src_hooks_useTonoAudio|src/hooks/useTonoAudio.ts]] *(Layer: #hook, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_alineacionAcordes|src/utils/alineacionAcordes.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_analisisAcordesCliente|src/utils/analisisAcordesCliente.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_armoniaVisor|src/utils/armoniaVisor.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_chordUtils|src/utils/chordUtils.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_estiloArmonia|src/utils/estiloArmonia.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_formatSongTitle|src/utils/formatSongTitle.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_grabarIdea|src/utils/grabarIdea.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_guardarConReversion|src/utils/guardarConReversion.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_ideaDeAtril|src/utils/ideaDeAtril.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_instrumentoProfesor|src/utils/instrumentoProfesor.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_lineaTiempoAcordes|src/utils/lineaTiempoAcordes.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_mezclaStems|src/utils/mezclaStems.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_modosAtril|src/utils/modosAtril.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_separacionIris|src/utils/separacionIris.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_shareUtils|src/utils/shareUtils.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_teoriaArmonica|src/utils/teoriaArmonica.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_repertorio_setlists|Repertorio y setlists]] *(from #feature)*
- [[src_components_ensayos_ModoLocalEnVivoTab|src/components/ensayos/ModoLocalEnVivoTab.tsx]] *(from #frontend)*
- [[src_components_SongStudioModal|src/components/SongStudioModal.tsx]] *(from #frontend)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/audit/acordesSobreTexto.test.tsx`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
