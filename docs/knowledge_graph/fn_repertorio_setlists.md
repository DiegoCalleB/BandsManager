---
id: fn_repertorio_setlists
title: "Repertorio y setlists"
layer: feature
domain: repertoire
file: "src/components/RepertorioSetlists.tsx"
tags: ["feature", "repertoire", "auto"]
---

# 📌 Repertorio y setlists

> **Ubicación:** `src/components/RepertorioSetlists.tsx`  
> **Capa:** `#layer/feature` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Catálogo de canciones, setlists, atril, modo escenario y práctica.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_repertoire|Repertoire DB Handlers]] *(Layer: #db, Domain: #repertoire)*
- [[ext_fal|fal.ai]] *(Layer: #external, Domain: #system)*
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[ext_gemini|Gemini (Google GenAI)]] *(Layer: #external, Domain: #system)*
- [[ext_replicate|Replicate]] *(Layer: #external, Domain: #system)*
- [[ext_supabase_storage|Supabase Storage]] *(Layer: #external, Domain: #system)*
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_concert_to_album|server/routes/concert_to_album.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_songs_index|server/routes/songs/index.ts]] *(Layer: #route, Domain: #repertoire)*
- [[server_routes_songs_structureUpload|server/routes/songs/structureUpload.ts]] *(Layer: #route, Domain: #repertoire)*
- [[server_routes_upload|server/routes/upload.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_acordesCancion|server/services/acordesCancion.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_letraCancion|server/services/letraCancion.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_components_Atril|src/components/Atril.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_SetlistPerformanceView|src/components/SetlistPerformanceView.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[tabla_band_letras_auto|tabla band_letras_auto]] *(Layer: #schema, Domain: #repertoire)*
- [[tabla_letras_jobs|tabla letras_jobs]] *(Layer: #schema, Domain: #repertoire)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*
- [[tabla_setlist_shortcuts|tabla setlist_shortcuts]] *(Layer: #schema, Domain: #repertoire)*
- [[tabla_setlists|tabla setlists]] *(Layer: #schema, Domain: #repertoire)*
- [[tabla_songs|tabla songs]] *(Layer: #schema, Domain: #repertoire)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(Layer: #frontend, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
