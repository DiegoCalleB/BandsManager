---
id: route_repertoire
title: "Repertoire & Setlists Route"
layer: route
domain: repertoire
file: "server/routes/repertorio.ts"
tags: ["api", "route", "repertoire"]
---

# 📌 Repertoire & Setlists Route

> **Ubicación:** `server/routes/repertorio.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Endpoints para canciones, compatibilidad armónica y exportación a setlist.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_repertoire|Repertoire DB Handlers]] *(Layer: #db, Domain: #repertoire)*
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_middleware_rateLimiter|server/middleware/rateLimiter.ts]] *(Layer: #security, Domain: #system)*
- [[server_routes_concert_to_album|server/routes/concert_to_album.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_acordesCancion|server/services/acordesCancion.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_colaLetras|server/services/colaLetras.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_services_letraCancion|server/services/letraCancion.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_services_profesorArmonia|server/services/profesorArmonia.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils|server/utils.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_analisisAcordes|server/utils/analisisAcordes.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_bandStyleContext|server/utils/bandStyleContext.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_bloqueoOido|server/utils/bloqueoOido.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_enrichCoversWithoutAudio|server/utils/enrichCoversWithoutAudio.ts]] *(Layer: #service, Domain: #booking)*
- [[server_utils_optimizeExistingWavs|server/utils/optimizeExistingWavs.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_perfectSetlistPlanner|server/utils/perfectSetlistPlanner.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_progresoOido|server/utils/progresoOido.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_setlistAIAnalyzer|server/utils/setlistAIAnalyzer.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_setlistFeedback|server/utils/setlistFeedback.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_setlistImport|server/utils/setlistImport.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_lineaTiempoAcordes|src/utils/lineaTiempoAcordes.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_songTitleMatch|src/utils/songTitleMatch.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_teoriaArmonica|src/utils/teoriaArmonica.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_repertorio_setlists|Repertorio y setlists]] *(from #feature)*
- [[server|server.ts]] *(from #route)*
- [[src_components_Atril|src/components/Atril.tsx]] *(from #frontend)*
- [[src_components_booking_venue_panel_hooks_buildVenuePanelActions|src/components/booking/venue_panel/hooks/buildVenuePanelActions.ts]] *(from #frontend)*
- [[src_components_Chatbot|src/components/Chatbot.tsx]] *(from #frontend)*
- [[src_components_chords_ModalOido|src/components/chords/ModalOido.tsx]] *(from #frontend)*
- [[src_components_PracticeModePanel|src/components/PracticeModePanel.tsx]] *(from #frontend)*
- [[src_components_repertorio_BulkAlbumAudioUploaderModal|src/components/repertorio/BulkAlbumAudioUploaderModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_DiscografiaView|src/components/repertorio/DiscografiaView.tsx]] *(from #frontend)*
- [[src_components_repertorio_hooks_useCatalogActions|src/components/repertorio/hooks/useCatalogActions.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useRepertorioDialogs|src/components/repertorio/hooks/useRepertorioDialogs.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useRepertorioPersistence|src/components/repertorio/hooks/useRepertorioPersistence.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useRepertorioPlaybackAndModals|src/components/repertorio/hooks/useRepertorioPlaybackAndModals.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useSetlistCrud|src/components/repertorio/hooks/useSetlistCrud.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useSetlistDeletion|src/components/repertorio/hooks/useSetlistDeletion.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useSetlistItemActions|src/components/repertorio/hooks/useSetlistItemActions.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useSetlistItemPopovers|src/components/repertorio/hooks/useSetlistItemPopovers.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useSetlistSync|src/components/repertorio/hooks/useSetlistSync.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useSongEditing|src/components/repertorio/hooks/useSongEditing.ts]] *(from #frontend)*
- [[src_components_repertorio_ImportSetlistModal|src/components/repertorio/ImportSetlistModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_LiveConcertToAlbumModal|src/components/repertorio/LiveConcertToAlbumModal.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioAiComposerModal|src/components/song_studio/SongStudioAiComposerModal.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioStructureUploadModal|src/components/song_studio/SongStudioStructureUploadModal.tsx]] *(from #frontend)*
- [[src_hooks_useColaLetras|src/hooks/useColaLetras.ts]] *(from #hook)*
- [[src_services_api|src/services/api.ts]] *(from #service)*
- [[src_utils_analisisAcordesCliente|src/utils/analisisAcordesCliente.ts]] *(from #service)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
