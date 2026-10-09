---
id: server_utils_spotifyMatch
title: "server/utils/spotifyMatch.ts"
layer: service
domain: system
file: "server/utils/spotifyMatch.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/spotifyMatch.ts

> **Ubicación:** `server/utils/spotifyMatch.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Elige, entre los resultados de la búsqueda de Spotify, el artista que es de verdad la banda

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(from #route)*
- [[server_services_spotifyService|server/services/spotifyService.ts]] *(from #service)*
- [[server_utils_metricasBanda|server/utils/metricasBanda.ts]] *(from #service)*
- [[server_utils_musicPreview|server/utils/musicPreview.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
