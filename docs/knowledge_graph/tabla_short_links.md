---
id: tabla_short_links
title: "tabla short_links"
layer: schema
domain: system
file: "supabase/migrations/20261015_enlaces_cortos.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla short_links

> **Ubicación:** `supabase/migrations/20261015_enlaces_cortos.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `short_links` (7 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_enlacesCortos|server/db/enlacesCortos.ts]] *(from #db)*
- [[tabla_short_link_clicks|tabla short_link_clicks]] *(from #schema)*

---

## 🗄️ Columnas
- `code`
- `band_id`
- `concert_id`
- `destino`
- `canal`
- `clave`
- `created_at`

**Definida en:** `supabase/migrations/20261015_enlaces_cortos.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
