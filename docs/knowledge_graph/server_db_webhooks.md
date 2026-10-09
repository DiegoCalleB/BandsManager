---
id: server_db_webhooks
title: "server/db/webhooks.ts"
layer: db
domain: system
file: "server/db/webhooks.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/webhooks.ts

> **Ubicación:** `server/db/webhooks.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: dbIsWebhookEventProcessed, dbRecordWebhookEvent.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[tabla_stripe_webhook_events|tabla stripe_webhook_events]] *(Layer: #schema, Domain: #finances)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db|server/db.ts]] *(from #db)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
