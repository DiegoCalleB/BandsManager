---
id: server_db_fans
title: "server/db/fans.ts"
layer: db
domain: social
file: "server/db/fans.ts"
tags: ["db", "social", "auto"]
---

# 📌 server/db/fans.ts

> **Ubicación:** `server/db/fans.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/social`

## 📖 Descripción
Fans de la banda (`fans`) y lista de espera de músicos (`musicians_waitlist`).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[tabla_fans|tabla fans]] *(Layer: #schema, Domain: #social)*
- [[tabla_leads|tabla leads]] *(Layer: #schema, Domain: #booking)*
- [[tabla_musicians_waitlist|tabla musicians_waitlist]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[fn_fans_epk|Fans y EPK]] *(from #feature)*
- [[server_db|server/db.ts]] *(from #db)*
- [[server_db_sync|server/db/sync.ts]] *(from #db)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/fans.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
