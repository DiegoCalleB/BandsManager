---
id: server_db_tiposRepertorio
title: "server/db/tiposRepertorio.ts"
layer: db
domain: system
file: "server/db/tiposRepertorio.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/tiposRepertorio.ts

> **Ubicación:** `server/db/tiposRepertorio.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Tipos de la capa de datos del repertorio (`songs`, `setlists`, `setlist_shortcuts`).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_repertoire|Repertoire DB Handlers]] *(from #db)*
- [[db_state_sync|In-Memory State & Supabase Sync]] *(from #db)*
- [[fn_repertorio_setlists|Repertorio y setlists]] *(from #feature)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
