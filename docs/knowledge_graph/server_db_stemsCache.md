---
id: server_db_stemsCache
title: "server/db/stemsCache.ts"
layer: db
domain: repertoire
file: "server/db/stemsCache.ts"
tags: ["db", "repertoire", "auto"]
---

# 📌 server/db/stemsCache.ts

> **Ubicación:** `server/db/stemsCache.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Caché de separación de stems (`song_stems_cache`) en memoria y persistente, con bloqueo para no

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[tabla_song_stems_cache|tabla song_stems_cache]] *(Layer: #schema, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/roformerStems.test.ts`
- `server/services/__tests__/stemWebhookAndLocks.test.ts`
- `server/services/__tests__/stemsReintento.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
