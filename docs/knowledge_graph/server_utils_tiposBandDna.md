---
id: server_utils_tiposBandDna
title: "server/utils/tiposBandDna.ts"
layer: service
domain: system
file: "server/utils/tiposBandDna.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/tiposBandDna.ts

> **Ubicación:** `server/utils/tiposBandDna.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Tipos de entrada de los constructores de prompt de `bandDna.ts`.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_leads|Leads DB Handlers]] *(Layer: #db, Domain: #booking)*
- [[server_db_autonomy|server/db/autonomy.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_tiposAdn|server/db/tiposAdn.ts]] *(Layer: #db, Domain: #system)*
- [[server_stateTypes|server/stateTypes.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_utils_bandDna|server/utils/bandDna.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
