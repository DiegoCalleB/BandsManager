---
id: server_routes_tiposConcertToAlbum
title: "server/routes/tiposConcertToAlbum.ts"
layer: route
domain: system
file: "server/routes/tiposConcertToAlbum.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/tiposConcertToAlbum.ts

> **Ubicación:** `server/routes/tiposConcertToAlbum.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Datos externos que lee el troceador de conciertos (concert_to_album.ts): los capítulos que

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
