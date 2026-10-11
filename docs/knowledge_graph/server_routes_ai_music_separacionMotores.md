---
id: server_routes_ai_music_separacionMotores
title: "server/routes/ai_music/separacionMotores.ts"
layer: route
domain: system
file: "server/routes/ai_music/separacionMotores.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/ai_music/separacionMotores.ts

> **Ubicación:** `server/routes/ai_music/separacionMotores.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Motores de separación de stems: cada uno recibe el contexto de la petición y devuelve los stems o

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_ai_music_cacheStems|server/routes/ai_music/cacheStems.ts]] *(Layer: #route, Domain: #repertoire)*
- [[server_routes_ai_music_diagnosticosInfra|server/routes/ai_music/diagnosticosInfra.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_ai_music_motorDemucs|server/routes/ai_music/motorDemucs.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_ai_music_motorFfmpeg|server/routes/ai_music/motorFfmpeg.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_ai_music_motorMdx23|server/routes/ai_music/motorMdx23.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_ai_music_motoresNeuronales|server/routes/ai_music/motoresNeuronales.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_ai_music_separacionContexto|server/routes/ai_music/separacionContexto.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_audioSeparator_index|server/services/audioSeparator/index.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[server_routes_ai_music_rutaSeparacion|server/routes/ai_music/rutaSeparacion.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
