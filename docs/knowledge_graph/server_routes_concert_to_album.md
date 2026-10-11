---
id: server_routes_concert_to_album
title: "server/routes/concert_to_album.ts"
layer: route
domain: system
file: "server/routes/concert_to_album.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/concert_to_album.ts

> **Ubicación:** `server/routes/concert_to_album.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Migración Concierto → Álbum: análisis y procesado de grabaciones en vivo (YouTube), detección de

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[sec_ssrf_guard|SSRF URL Validator]] *(Layer: #security, Domain: #system)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_audioEnergy|server/utils/audioEnergy.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_storage|server/utils/storage.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_youtubeSource|server/utils/youtubeSource.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[fn_repertorio_setlists|Repertorio y setlists]] *(from #feature)*
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*
- [[server|server.ts]] *(from #route)*
- [[server_services_letraCancion|server/services/letraCancion.ts]] *(from #service)*
- [[src_components_repertorio_live_concert_album_hooks_useAlbumGeneration|src/components/repertorio/live_concert_album/hooks/useAlbumGeneration.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useConcertAnalysis|src/components/repertorio/live_concert_album/hooks/useConcertAnalysis.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useConcertSourceMedia|src/components/repertorio/live_concert_album/hooks/useConcertSourceMedia.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useConcertTranscription|src/components/repertorio/live_concert_album/hooks/useConcertTranscription.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useSnippetPreview|src/components/repertorio/live_concert_album/hooks/useSnippetPreview.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useYoutubeCookies|src/components/repertorio/live_concert_album/hooks/useYoutubeCookies.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_types|src/components/repertorio/live_concert_album/types.ts]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/acordesHonestos.test.ts`
- `server/routes/__tests__/concertCueDetection.test.ts`
- `server/routes/__tests__/rutaFuenteSegura.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
