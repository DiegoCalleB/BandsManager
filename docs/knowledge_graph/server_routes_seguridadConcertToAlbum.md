---
id: server_routes_seguridadConcertToAlbum
title: "server/routes/seguridadConcertToAlbum.ts"
layer: route
domain: system
file: "server/routes/seguridadConcertToAlbum.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/seguridadConcertToAlbum.ts

> **Ubicación:** `server/routes/seguridadConcertToAlbum.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: rutaFuenteSegura, rutaEnDirectorio, indicePistaSeguro, esUrlYoutube, extraerObjetoJson.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[fn_repertorio_setlists|Repertorio y setlists]] *(from #feature)*
- [[server_routes_concert_to_album|server/routes/concert_to_album.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
