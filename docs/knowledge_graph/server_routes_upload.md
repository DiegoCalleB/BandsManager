---
id: server_routes_upload
title: "server/routes/upload.ts"
layer: route
domain: system
file: "server/routes/upload.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/upload.ts

> **Ubicación:** `server/routes/upload.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Subida de archivos (simple y por chunks) a Supabase Storage, estadísticas de almacenamiento y

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[ext_supabase|Supabase (Postgres)]] *(Layer: #external, Domain: #system)*
- [[ext_supabase_storage|Supabase Storage]] *(Layer: #external, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[fn_reels_social|Reels y redes sociales]] *(from #feature)*
- [[fn_repertorio_setlists|Repertorio y setlists]] *(from #feature)*
- [[server|server.ts]] *(from #route)*
- [[server_routes_songs_structureUpload|server/routes/songs/structureUpload.ts]] *(from #route)*
- [[server_utils_storage|server/utils/storage.ts]] *(from #service)*
- [[src_components_repertorio_LiveConcertToAlbumModal|src/components/repertorio/LiveConcertToAlbumModal.tsx]] *(from #frontend)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/auditoriaSeguridadPR2.test.ts`
- `server/routes/__tests__/subcarpetaSegura.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
