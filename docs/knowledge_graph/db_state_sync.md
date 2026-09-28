---
id: db_state_sync
title: "In-Memory State & Supabase Sync"
layer: db
domain: system
file: "server/state.ts"
tags: ["database", "memory", "sync"]
---

# 📌 In-Memory State & Supabase Sync

> **Ubicación:** `server/state.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Copia en memoria de alta velocidad sincronizada con Supabase al arranque.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[hook_app_data|useAppData Hook]] *(from #hook)*
- [[db_leads|Leads DB Handlers]] *(from #db)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
