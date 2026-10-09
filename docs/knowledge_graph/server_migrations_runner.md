---
id: server_migrations_runner
title: "server/migrations/runner.ts"
layer: service
domain: system
file: "server/migrations/runner.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/migrations/runner.ts

> **Ubicación:** `server/migrations/runner.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Aplicador de migraciones: ejecuta las de supabase/migrations/*.sql que aún no se hayan

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_schema_migrations|tabla schema_migrations]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🧪 Tests que lo cubren
- `server/migrations/__tests__/runner.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
