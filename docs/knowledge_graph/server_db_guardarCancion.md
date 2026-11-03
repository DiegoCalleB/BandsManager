---
id: server_db_guardarCancion
title: "server/db/guardarCancion.ts"
layer: db
domain: system
file: "server/db/guardarCancion.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/guardarCancion.ts

> **Ubicación:** `server/db/guardarCancion.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Escritura de una canción SIN ventana en la que no exista.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_supabase|Supabase (Postgres)]] *(Layer: #external, Domain: #system)*
- [[tabla_songs|tabla songs]] *(Layer: #schema, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_repertoire|Repertoire DB Handlers]] *(from #db)*
- [[fn_repertorio_setlists|Repertorio y setlists]] *(from #feature)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/guardarCancion.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
