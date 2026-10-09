---
id: server_services_colaLetras
title: "server/services/colaLetras.ts"
layer: service
domain: repertoire
file: "server/services/colaLetras.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 server/services/colaLetras.ts

> **Ubicación:** `server/services/colaLetras.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Cola de transcripción de letras en el servidor: sobrevive a recargar o cerrar la pestaña (los

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_services_letraCancion|server/services/letraCancion.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_colaLetras|server/utils/colaLetras.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_transcripcionMasiva|src/utils/transcripcionMasiva.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_repertoire|Repertoire DB Handlers]] *(from #db)*
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
