---
id: server_routes_songs_index
title: "server/routes/songs/index.ts"
layer: route
domain: repertoire
file: "server/routes/songs/index.ts"
tags: ["route", "repertoire", "auto"]
---

# 📌 server/routes/songs/index.ts

> **Ubicación:** `server/routes/songs/index.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Router de `/songs`: monta los sub-routers de subida de estructura.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_songs_structureUpload|server/routes/songs/structureUpload.ts]] *(Layer: #route, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
