---
id: server_db_campaigns
title: "server/db/campaigns.ts"
layer: db
domain: system
file: "server/db/campaigns.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/campaigns.ts

> **Ubicación:** `server/db/campaigns.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Campañas de booking (`booking_campaigns`) y su normalización desde BD.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[tabla_booking_campaigns|tabla booking_campaigns]] *(Layer: #schema, Domain: #booking)*
- [[tabla_campaigns|tabla campaigns]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(from #route)*
- [[server_db|server/db.ts]] *(from #db)*
- [[server_db_sync|server/db/sync.ts]] *(from #db)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/campaigns.test.ts`
- `server/db/__tests__/campaignsIntegridad.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
