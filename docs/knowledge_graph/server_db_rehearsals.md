---
id: server_db_rehearsals
title: "server/db/rehearsals.ts"
layer: db
domain: system
file: "server/db/rehearsals.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/rehearsals.ts

> **Ubicación:** `server/db/rehearsals.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Ensayos (`rehearsals`): lectura, upsert y borrado acotados por `bandId`.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_mergeWithExisting|server/db/mergeWithExisting.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_tolerantWrite|server/db/tolerantWrite.ts]] *(Layer: #db, Domain: #system)*
- [[tabla_rehearsals|tabla rehearsals]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[fn_ensayos|Ensayos]] *(from #feature)*
- [[fn_fans_epk|Fans y EPK]] *(from #feature)*
- [[server_db|server/db.ts]] *(from #db)*
- [[server_db_sync|server/db/sync.ts]] *(from #db)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/rehearsalsPartialSaveMerge.test.ts`
- `server/routes/__tests__/deleteEvents.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
