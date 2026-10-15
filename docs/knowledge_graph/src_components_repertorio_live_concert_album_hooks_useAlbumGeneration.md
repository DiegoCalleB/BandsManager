---
id: src_components_repertorio_live_concert_album_hooks_useAlbumGeneration
title: "src/components/repertorio/live_concert_album/hooks/useAlbumGeneration.ts"
layer: frontend
domain: system
file: "src/components/repertorio/live_concert_album/hooks/useAlbumGeneration.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/live_concert_album/hooks/useAlbumGeneration.ts

> **Ubicación:** `src/components/repertorio/live_concert_album/hooks/useAlbumGeneration.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Genera el disco (corte en servidor), crea el setlist del concierto y guarda el álbum en el catálogo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[server_routes_concert_to_album|server/routes/concert_to_album.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_repertorio_live_concert_album_types|src/components/repertorio/live_concert_album/types.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorMessage|src/utils/errorMessage.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_live_concert_album_hooks_useLiveConcertAlbumController|src/components/repertorio/live_concert_album/hooks/useLiveConcertAlbumController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
