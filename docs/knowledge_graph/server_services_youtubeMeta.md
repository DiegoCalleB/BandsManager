---
id: server_services_youtubeMeta
title: "server/services/youtubeMeta.ts"
layer: service
domain: system
file: "server/services/youtubeMeta.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/youtubeMeta.ts

> **Ubicación:** `server/services/youtubeMeta.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Ficha de un vídeo de YouTube (título, canal, duración, capítulos) probando varias fuentes.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_youtubeSource|server/utils/youtubeSource.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*
- [[server_routes_reelsProgramacion|server/routes/reelsProgramacion.ts]] *(from #route)*
- [[server_services_senalesVideo|server/services/senalesVideo.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
