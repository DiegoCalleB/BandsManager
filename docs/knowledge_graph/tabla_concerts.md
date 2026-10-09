---
id: tabla_concerts
title: "tabla concerts"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla concerts

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `concerts` (35 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_concerts|server/db/concerts.ts]] *(from #db)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `band_name`
- `fecha`
- `ciudad`
- `sala`
- `direccion`
- `cache`
- `aforo_vendido`
- `aforo_total`
- `contrato_firmado`
- `estado_pago`
- `notas`
- `tipo`
- `setlist_id`
- `gastos_detalle`
- `gastos_estimados_tipicos`
- `convocatoria_tipo`
- `convocados_ids`
- `convocados_nombres`
- `idioma`
- `is_posible`
- `custom_qr_url`
- `cartel_url`
- `es_hito_destacado`
- `asistencia_propia`
- `asistencia_otras_bandas`
- `bandas_compartidas`
- `post_show_review`
- `gira_id`
- `gira_nombre`
- `entradas_url`
- `entradas_lugar_fisico`
- `created_at`
- `updated_at`

**Definida en:** `supabase_schema.sql`, `supabase_migration_only_new.sql`, `supabase/migrations/20261017_concerts_columnas_faltantes.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
