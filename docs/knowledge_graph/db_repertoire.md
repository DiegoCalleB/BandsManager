---
id: db_repertoire
title: "Repertoire DB Handlers"
layer: db
domain: repertoire
file: "server/db/repertoire.ts"
tags: ["database", "repertoire"]
---

# 📌 Repertoire DB Handlers

> **Ubicación:** `server/db/repertoire.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Persistencia de canciones, pistas, energía y afinaciones.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(from #security)*
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
