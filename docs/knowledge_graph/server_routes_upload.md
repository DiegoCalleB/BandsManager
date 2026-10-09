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
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_songs_structureUpload|server/routes/songs/structureUpload.ts]] *(from #route)*
- [[server_utils_storage|server/utils/storage.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
