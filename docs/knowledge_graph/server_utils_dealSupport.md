---
id: server_utils_dealSupport
title: "server/utils/dealSupport.ts"
layer: service
domain: system
file: "server/utils/dealSupport.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/dealSupport.ts

> **Ubicación:** `server/utils/dealSupport.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Aportación voluntaria a BandManager al cerrar un bolo (sustituye, de momento, a la comisión

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_deals|server/db/deals.ts]] *(from #db)*
- [[server_db_dealSupport|server/db/dealSupport.ts]] *(from #db)*
- [[server_routes_donations|server/routes/donations.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
