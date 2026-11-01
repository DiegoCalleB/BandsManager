---
id: server_services_analisisAcordesRapido
title: "server/services/analisisAcordesRapido.ts"
layer: service
domain: system
file: "server/services/analisisAcordesRapido.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/analisisAcordesRapido.ts

> **Ubicación:** `server/services/analisisAcordesRapido.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Acordes en segundos, compases «afinados» después.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_repertoire|Repertoire DB Handlers]] *(Layer: #db, Domain: #repertoire)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_services_acordesCancion|server/services/acordesCancion.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_songs|tabla songs]] *(Layer: #schema, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/analisisAcordesRapido.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
