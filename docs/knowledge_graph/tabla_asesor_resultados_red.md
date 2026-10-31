---
id: tabla_asesor_resultados_red
title: "tabla asesor_resultados_red"
layer: schema
domain: system
file: "supabase/migrations/20261125_asesor_resultados_red.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla asesor_resultados_red

> **Ubicación:** `supabase/migrations/20261125_asesor_resultados_red.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `asesor_resultados_red` (9 columnas).

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
- `formato`
- `titulo`
- `metricas`
- `created_at`

**Definida en:** `supabase/migrations/20261125_asesor_resultados_red.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
