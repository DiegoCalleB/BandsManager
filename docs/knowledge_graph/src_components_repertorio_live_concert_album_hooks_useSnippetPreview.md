---
id: src_components_repertorio_live_concert_album_hooks_useSnippetPreview
title: "src/components/repertorio/live_concert_album/hooks/useSnippetPreview.ts"
layer: frontend
domain: system
file: "src/components/repertorio/live_concert_album/hooks/useSnippetPreview.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/live_concert_album/hooks/useSnippetPreview.ts

> **Ubicación:** `src/components/repertorio/live_concert_album/hooks/useSnippetPreview.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Reproduce la muestra de un corte y fija inicio/fin desde la posición del reproductor.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
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
