---
id: tabla_short_link_clicks
title: "tabla short_link_clicks"
layer: schema
domain: system
file: "supabase/migrations/20261015_enlaces_cortos.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla short_link_clicks

> **Ubicación:** `supabase/migrations/20261015_enlaces_cortos.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `short_link_clicks` (7 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_short_links|tabla short_links]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_enlacesCortos|server/db/enlacesCortos.ts]] *(from #db)*

---

## 🗄️ Columnas
- `id`
- `code`
- `band_id`
- `clicked_at`
- `visitante`
- `dispositivo`
- `origen`

**Definida en:** `supabase/migrations/20261015_enlaces_cortos.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
