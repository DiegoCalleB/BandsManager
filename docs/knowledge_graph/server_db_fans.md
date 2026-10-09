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

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db|server/db.ts]] *(from #db)*
- [[server_db_sync|server/db/sync.ts]] *(from #db)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
