---
id: ui_repertoire_setlists
title: "Repertorio & Setlists"
layer: frontend
domain: repertoire
file: "src/components/RepertorioSetlists.tsx"
tags: ["ui", "repertoire", "audio"]
---

# 📌 Repertorio & Setlists

> **Ubicación:** `src/components/RepertorioSetlists.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Gestión de canciones, directos, compatibilidad tonal y transiciones armónicas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_repertoire|Repertoire DB Handlers]] *(Layer: #db, Domain: #repertoire)*
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[src_components_AlbumCover|src/components/AlbumCover.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_Atril|src/components/Atril.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_SetlistPerformanceView|src/components/SetlistPerformanceView.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_ShareModal|src/components/ShareModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_SongStudioModal|src/components/SongStudioModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_SpotifyPlayerBar|src/components/SpotifyPlayerBar.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_ModuleTutorialModal|src/components/common/ModuleTutorialModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_AddSongsToSetlistModal|src/components/repertorio/AddSongsToSetlistModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_AssignSetlistModal|src/components/repertorio/AssignSetlistModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_AssignSongsToAlbumModal|src/components/repertorio/AssignSongsToAlbumModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_ConfirmDeleteAlbumModal|src/components/repertorio/ConfirmDeleteAlbumModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_ConfirmDeleteModal|src/components/repertorio/ConfirmDeleteModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_DiscografiaView|src/components/repertorio/DiscografiaView.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_EnergyChart|src/components/repertorio/EnergyChart.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_EscenarioView|src/components/repertorio/EscenarioView.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_ImportSetlistModal|src/components/repertorio/ImportSetlistModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_MemberNotesModal|src/components/repertorio/MemberNotesModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_PdfExportModal|src/components/repertorio/PdfExportModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_PerfectSetlistModal|src/components/repertorio/PerfectSetlistModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_RepertorioNavBar|src/components/repertorio/RepertorioNavBar.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_SetlistAIAnalysisModal|src/components/repertorio/SetlistAIAnalysisModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_SetlistAddBar|src/components/repertorio/SetlistAddBar.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_SetlistModal|src/components/repertorio/SetlistModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_ShowItemModal|src/components/repertorio/ShowItemModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_SongCardRow|src/components/repertorio/SongCardRow.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_SongModal|src/components/repertorio/SongModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_SongTransitionPreviewModal|src/components/repertorio/SongTransitionPreviewModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_SpotifyDiscographyModal|src/components/repertorio/SpotifyDiscographyModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_PopoverAncla|src/components/ui/PopoverAncla.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_PublicoSilhouette|src/components/ui/PublicoSilhouette.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_config_defaultRepertoire|src/config/defaultRepertoire.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_config_sampleRepertoire|src/config/sampleRepertoire.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_context_LanguageContext|src/context/LanguageContext.tsx]] *(Layer: #service, Domain: #system)*
- [[src_context_PlayerContext|src/context/PlayerContext.tsx]] *(Layer: #service, Domain: #system)*
- [[src_db_seed|src/db_seed.ts]] *(Layer: #service, Domain: #system)*
- [[src_hooks_useAudioPlayer|src/hooks/useAudioPlayer.ts]] *(Layer: #hook, Domain: #repertoire)*
- [[src_hooks_useCatalogFilters|src/hooks/useCatalogFilters.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useModuleTutorial|src/hooks/useModuleTutorial.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useShareModal|src/hooks/useShareModal.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useStagePlayer|src/hooks/useStagePlayer.ts]] *(Layer: #hook, Domain: #system)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_analisisAcordesCliente|src/utils/analisisAcordesCliente.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioLatency|src/utils/audioLatency.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_chordUtils|src/utils/chordUtils.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_energyPacingUtils|src/utils/energyPacingUtils.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_formatSongTitle|src/utils/formatSongTitle.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_guardarConReversion|src/utils/guardarConReversion.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_harmonicAnalysis|src/utils/harmonicAnalysis.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_moduloGlobal|src/utils/moduloGlobal.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_offlineSync|src/utils/offlineSync.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_repertorioPdf|src/utils/repertorioPdf.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_repertorioUtils|src/utils/repertorioUtils.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_setlistCompatibility|src/utils/setlistCompatibility.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_songTitleMatch|src/utils/songTitleMatch.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_stageOfflineCache|src/utils/stageOfflineCache.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_repertorio_setlists|Repertorio y setlists]] *(from #feature)*
- [[src_App|src/App.tsx]] *(from #frontend)*
- [[src_components_repertorio_EscenarioView|src/components/repertorio/EscenarioView.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
