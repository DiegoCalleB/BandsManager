---
id: server_db_leadAprobacion
title: "server/db/leadAprobacion.ts"
layer: db
domain: booking
file: "server/db/leadAprobacion.ts"
tags: ["db", "booking", "auto"]
---

# 📌 server/db/leadAprobacion.ts

> **Ubicación:** `server/db/leadAprobacion.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/booking`

## 📖 Descripción
Sello de la aprobación humana en `leads` (ver server/utils/aprobacionLead.ts). Escritura aparte de

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_aprobacionLead|server/utils/aprobacionLead.ts]] *(Layer: #service, Domain: #booking)*
- [[tabla_leads|tabla leads]] *(Layer: #schema, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db|server/db.ts]] *(from #db)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
