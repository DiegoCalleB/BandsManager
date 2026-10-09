---
id: server_db_contacts
title: "server/db/contacts.ts"
layer: db
domain: system
file: "server/db/contacts.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/contacts.ts

> **Ubicación:** `server/db/contacts.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Contactos de la banda (`band_contacts`): lectura, upsert y borrado (también en bloque).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_enlacesBandas|server/db/enlacesBandas.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_enlacesBandas|server/utils/enlacesBandas.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_band_contacts|tabla band_contacts]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[fn_fans_epk|Fans y EPK]] *(from #feature)*
- [[server_db|server/db.ts]] *(from #db)*
- [[server_db_sync|server/db/sync.ts]] *(from #db)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/contacts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
