---
id: tabla_asesor_resultados
title: "tabla asesor_resultados"
layer: schema
domain: system
file: "supabase/migrations/20261124_asesor_resultados.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla asesor_resultados

> **Ubicación:** `supabase/migrations/20261124_asesor_resultados.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `asesor_resultados` (10 columnas).

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
- `formato`
- `titulo`
- `alcance`
- `guardados`
- `alcance_no_seguidores`
- `created_at`

**Definida en:** `supabase/migrations/20261124_asesor_resultados.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
