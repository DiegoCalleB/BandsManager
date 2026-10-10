---
id: src_utils_errorMessage
title: "src/utils/errorMessage.ts"
layer: service
domain: system
file: "src/utils/errorMessage.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/errorMessage.ts

> **Ubicación:** `src/utils/errorMessage.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Extracción segura del mensaje de un valor capturado en `catch`, que en TypeScript estricto es `unknown`.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_venue_panel_hooks_buildVenuePanelActions|src/components/booking/venue_panel/hooks/buildVenuePanelActions.ts]] *(from #frontend)*
- [[src_components_booking_venue_panel_hooks_useVenueEnrichment|src/components/booking/venue_panel/hooks/useVenueEnrichment.ts]] *(from #frontend)*
- [[src_components_booking_venue_panel_hooks_useVenueScoutActions|src/components/booking/venue_panel/hooks/useVenueScoutActions.ts]] *(from #frontend)*
- [[src_components_booking_venue_panel_VenueAgentWorkflowBanner|src/components/booking/venue_panel/VenueAgentWorkflowBanner.tsx]] *(from #agent)*
- [[src_components_reels_center_hooks_useAnalysisTimeline|src/components/reels_center/hooks/useAnalysisTimeline.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useClipRendering|src/components/reels_center/hooks/useClipRendering.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useReelsSync|src/components/reels_center/hooks/useReelsSync.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useVideoAnalyzer|src/components/reels_center/hooks/useVideoAnalyzer.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useSetlistReordering|src/components/repertorio/hooks/useSetlistReordering.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useAlbumGeneration|src/components/repertorio/live_concert_album/hooks/useAlbumGeneration.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useConcertAnalysis|src/components/repertorio/live_concert_album/hooks/useConcertAnalysis.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useConcertSourceMedia|src/components/repertorio/live_concert_album/hooks/useConcertSourceMedia.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useConcertTranscription|src/components/repertorio/live_concert_album/hooks/useConcertTranscription.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useSnippetPreview|src/components/repertorio/live_concert_album/hooks/useSnippetPreview.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useYoutubeCookies|src/components/repertorio/live_concert_album/hooks/useYoutubeCookies.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useIdeaMicRecording|src/components/song_studio/hooks/useIdeaMicRecording.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useTrackMixerActions|src/components/song_studio/hooks/useTrackMixerActions.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useTrackOverdub|src/components/song_studio/hooks/useTrackOverdub.ts]] *(from #frontend)*
- [[ui_venue_detail|Venue Detail & Pitch Simulator]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/errorMessage.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
