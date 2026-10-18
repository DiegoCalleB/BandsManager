---
id: tabla_data_change_history
title: "tabla data_change_history"
layer: schema
domain: system
file: "supabase/migrations/20260922_data_change_history.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla data_change_history

> **Ubicación:** `supabase/migrations/20260922_data_change_history.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `data_change_history` (7 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*

---

## 🗄️ Columnas
- `id`
- `tabla`
- `fila_id`
- `band_id`
- `operacion`
- `datos_anteriores`
- `changed_at`

**Definida en:** `supabase/migrations/20260922_data_change_history.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
