---
id: server_db_tolerantWrite
title: "server/db/tolerantWrite.ts"
layer: db
domain: system
file: "server/db/tolerantWrite.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/tolerantWrite.ts

> **Ubicación:** `server/db/tolerantWrite.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Escritura tolerante a columnas que aún no existen.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_guardadoParcial|server/utils/guardadoParcial.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_leads|Leads DB Handlers]] *(from #db)*
- [[server_db_concerts|server/db/concerts.ts]] *(from #db)*
- [[server_db_deals|server/db/deals.ts]] *(from #db)*
- [[server_db_epk|server/db/epk.ts]] *(from #db)*
- [[server_db_rehearsals|server/db/rehearsals.ts]] *(from #db)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/tolerantWrite.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
