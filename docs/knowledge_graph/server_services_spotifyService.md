---
id: server_services_spotifyService
title: "server/services/spotifyService.ts"
layer: service
domain: system
file: "server/services/spotifyService.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/spotifyService.ts

> **Ubicación:** `server/services/spotifyService.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: SpotifyTrackData, SpotifyAlbumData, SpotifyArtistDiscography, artistaSpotifyExiste, getSpotifyAccessToken, extractSpotifyArtistId, searchSpotifyArtists, resolverUrlSpotifyDeBanda.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_spotify|Spotify]] *(Layer: #external, Domain: #system)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils|server/utils.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_spotifyMatch|server/utils/spotifyMatch.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*
- [[fn_metricas_panel|Panel y métricas]] *(from #feature)*
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(from #route)*
- [[server_routes_bands|server/routes/bands.ts]] *(from #route)*
- [[server_routes_spotify|server/routes/spotify.ts]] *(from #route)*
- [[server_services_metricasBandaService|server/services/metricasBandaService.ts]] *(from #service)*
- [[server_services_venueIntelligenceService|server/services/venueIntelligenceService.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
