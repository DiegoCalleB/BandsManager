---
id: server_db_epk
title: "server/db/epk.ts"
layer: db
domain: epk
file: "server/db/epk.ts"
tags: ["db", "epk", "auto"]
---

# 📌 server/db/epk.ts

> **Ubicación:** `server/db/epk.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/epk`

## 📖 Descripción
Configuración del EPK de la banda (`epk_configs`) y mapa de logos.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_sync|server/db/sync.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_tolerantWrite|server/db/tolerantWrite.ts]] *(Layer: #db, Domain: #system)*
- [[tabla_epk_configs|tabla epk_configs]] *(Layer: #schema, Domain: #epk)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(from #agent)*
- [[server_db|server/db.ts]] *(from #db)*
- [[server_db_sync|server/db/sync.ts]] *(from #db)*
- [[server_services_perfilPublicoBanda|server/services/perfilPublicoBanda.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/epkCamposEditables.test.ts`
- `server/db/__tests__/epkCifrasResenasMerge.test.ts`
- `server/db/__tests__/epkMiembrosMerge.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
