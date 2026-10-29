---
id: tabla_asesor_acciones
title: "tabla asesor_acciones"
layer: schema
domain: system
file: "supabase/migrations/20261123_asesor_acciones.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla asesor_acciones

> **Ubicación:** `supabase/migrations/20261123_asesor_acciones.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `asesor_acciones` (8 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `fecha`
- `tarjeta_id`
- `como`
- `accion`
- `created_at`
- `titulo`

**Definida en:** `supabase/migrations/20261123_asesor_acciones.sql`, `supabase/migrations/20261124_asesor_resultados.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
