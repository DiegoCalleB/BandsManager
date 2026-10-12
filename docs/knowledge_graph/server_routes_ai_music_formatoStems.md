---
id: server_routes_ai_music_formatoStems
title: "server/routes/ai_music/formatoStems.ts"
layer: route
domain: repertoire
file: "server/routes/ai_music/formatoStems.ts"
tags: ["route", "repertoire", "auto"]
---

# 📌 server/routes/ai_music/formatoStems.ts

> **Ubicación:** `server/routes/ai_music/formatoStems.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Formato de los stems para el cliente (orden canónico y metadatos), hosts de almacenamiento de confianza y marcado de trabajos fallidos.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_stemsCache|server/db/stemsCache.ts]] *(Layer: #db, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[server_routes_ai_music_audioPublico|server/routes/ai_music/audioPublico.ts]] *(from #route)*
- [[server_routes_ai_music_rutaSeparacion|server/routes/ai_music/rutaSeparacion.ts]] *(from #route)*
- [[server_routes_ai_music_rutasEstadoStems|server/routes/ai_music/rutasEstadoStems.ts]] *(from #route)*
- [[server_routes_ai_music_separacionContexto|server/routes/ai_music/separacionContexto.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
