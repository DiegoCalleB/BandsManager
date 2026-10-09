---
id: server_audit_pgliteSchema
title: "server/audit/pgliteSchema.ts"
layer: service
domain: system
file: "server/audit/pgliteSchema.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/audit/pgliteSchema.ts

> **Ubicación:** `server/audit/pgliteSchema.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Postgres local en memoria (PGlite) con el esquema REAL del proyecto: supabase_schema.sql y

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🧪 Tests que lo cubren
- `server/audit/__tests__/dbRoundTrip.test.ts`
- `server/audit/__tests__/schemaContract.test.ts`
- `server/migrations/__tests__/runner.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
