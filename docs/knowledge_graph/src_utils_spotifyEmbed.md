---
id: src_utils_spotifyEmbed
title: "src/utils/spotifyEmbed.ts"
layer: service
domain: system
file: "src/utils/spotifyEmbed.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/spotifyEmbed.ts

> **Ubicación:** `src/utils/spotifyEmbed.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Convierte el enlace de Spotify que guarda una banda (`spotify_youtube`, campo libre que

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(from #route)*
- [[server_services_metricasBandaService|server/services/metricasBandaService.ts]] *(from #service)*
- [[src_components_BandCRM|src/components/BandCRM.tsx]] *(from #frontend)*
- [[src_components_BandMap|src/components/BandMap.tsx]] *(from #frontend)*
- [[src_components_booking_BandListenEmbed|src/components/booking/BandListenEmbed.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
