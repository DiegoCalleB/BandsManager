---
id: server_services_letraCancion
title: "server/services/letraCancion.ts"
layer: service
domain: repertoire
file: "server/services/letraCancion.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 server/services/letraCancion.ts

> **Ubicación:** `server/services/letraCancion.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Letra y acordes del audio de UNA canción, sincronizados. Lo usan la ruta manual

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_routes_concert_to_album|server/routes/concert_to_album.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_acordesCancion|server/services/acordesCancion.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_transcripcionLetra|server/services/transcripcionLetra.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_bloqueoOido|server/utils/bloqueoOido.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_cifradoSincronizado|server/utils/cifradoSincronizado.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_progresoOido|server/utils/progresoOido.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*
- [[server_services_colaLetras|server/services/colaLetras.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
