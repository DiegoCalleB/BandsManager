---
id: server_db_cartelEstilo
title: "server/db/cartelEstilo.ts"
layer: db
domain: system
file: "server/db/cartelEstilo.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/cartelEstilo.ts

> **Ubicación:** `server/db/cartelEstilo.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
ADN visual de la banda para sus carteles (`band_cartel_estilo`). El `bandId` llega YA resuelto por

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[src_utils_cartel_adn|src/utils/cartel/adn.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_band_cartel_estilo|tabla band_cartel_estilo]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[server_routes_cartelria|server/routes/cartelria.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
