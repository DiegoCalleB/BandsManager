---
id: server_db_autonomy
title: "server/db/autonomy.ts"
layer: db
domain: system
file: "server/db/autonomy.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/autonomy.ts

> **Ubicación:** `server/db/autonomy.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: ResponseStrategy, AutonomyConfig, dbGetAutonomyConfig, dbUpsertAutonomyConfig.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[tabla_autonomy_configs|tabla autonomy_configs]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_redactor|Agente Redactor (borradores de respuesta)]] *(from #agent)*
- [[server_db|server/db.ts]] *(from #db)*
- [[server_db_sync|server/db/sync.ts]] *(from #db)*
- [[server_routes_bands_responseStrategies|server/routes/bands/responseStrategies.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/autonomyResponseStrategiesMerge.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
