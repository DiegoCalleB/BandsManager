---
id: server_db_enlacesBandas
title: "server/db/enlacesBandas.ts"
layer: db
domain: system
file: "server/db/enlacesBandas.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/enlacesBandas.ts

> **Ubicación:** `server/db/enlacesBandas.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Enlaces de bandas amigas (`enlaces_bandas_amigas`): lectura por lotes, escritura y borrado.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_enlacesBandas|server/utils/enlacesBandas.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_asistente_ia|Asistente de IA (chat)]] *(from #feature)*
- [[server_db_contacts|server/db/contacts.ts]] *(from #db)*
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
