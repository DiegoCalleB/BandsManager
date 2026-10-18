---
id: server_routes_ai_music_separacionContexto
title: "server/routes/ai_music/separacionContexto.ts"
layer: route
domain: system
file: "server/routes/ai_music/separacionContexto.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/ai_music/separacionContexto.ts

> **Ubicación:** `server/routes/ai_music/separacionContexto.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Contexto de una petición de separación de stems (banda, tema, motor y credenciales resueltos) y

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_fal|fal.ai]] *(Layer: #external, Domain: #system)*
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db_stemsCache|server/db/stemsCache.ts]] *(Layer: #db, Domain: #repertoire)*
- [[server_routes_ai_music_diagnosticos|server/routes/ai_music/diagnosticos.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_ai_music_diagnosticosInfra|server/routes/ai_music/diagnosticosInfra.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_ai_music_formatoStems|server/routes/ai_music/formatoStems.ts]] *(Layer: #route, Domain: #repertoire)*
- [[server_services_audioSeparator_FalAiService|server/services/audioSeparator/FalAiService.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[server_routes_ai_music_rutaSeparacion|server/routes/ai_music/rutaSeparacion.ts]] *(from #route)*
- [[server_routes_ai_music_separacionMotores|server/routes/ai_music/separacionMotores.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
