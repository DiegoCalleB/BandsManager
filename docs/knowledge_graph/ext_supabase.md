---
id: ext_supabase
title: "Supabase (Postgres)"
layer: external
domain: system
file: "servicio externo"
tags: ["external", "auto"]
---

# 📌 Supabase (Postgres)

> **Ubicación:** `servicio externo`  
> **Capa:** `#layer/external` | **Dominio:** `#domain/system`

## 📖 Descripción
Base de datos y cliente `@supabase/supabase-js`.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_core|server/db/core.ts]] *(from #db)*
- [[server_routes_upload|server/routes/upload.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
