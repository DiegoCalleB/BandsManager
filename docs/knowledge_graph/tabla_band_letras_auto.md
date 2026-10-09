---
id: tabla_band_letras_auto
title: "tabla band_letras_auto"
layer: schema
domain: repertoire
file: "supabase/migrations/20261014_letras_automaticas.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla band_letras_auto

> **Ubicación:** `supabase/migrations/20261014_letras_automaticas.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Tabla de Supabase `band_letras_auto` (3 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_services_colaLetras|server/services/colaLetras.ts]] *(from #service)*

---

## 🗄️ Columnas
- `band_id`
- `activado`
- `updated_at`

**Definida en:** `supabase/migrations/20261014_letras_automaticas.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
