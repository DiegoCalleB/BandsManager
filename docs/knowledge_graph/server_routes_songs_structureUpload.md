---
id: server_routes_songs_structureUpload
title: "server/routes/songs/structureUpload.ts"
layer: route
domain: repertoire
file: "server/routes/songs/structureUpload.ts"
tags: ["route", "repertoire", "auto"]
---

# 📌 server/routes/songs/structureUpload.ts

> **Ubicación:** `server/routes/songs/structureUpload.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Subida y procesado de la estructura de una canción (`/songs/...`).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_repertoire|Repertoire DB Handlers]] *(Layer: #db, Domain: #repertoire)*
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_routes_upload|server/routes/upload.ts]] *(Layer: #route, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_songs_index|server/routes/songs/index.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
