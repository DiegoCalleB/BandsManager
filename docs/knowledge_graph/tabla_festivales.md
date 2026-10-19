---
id: tabla_festivales
title: "tabla festivales"
layer: schema
domain: system
file: "supabase/migrations/20261111_festivales.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla festivales

> **Ubicación:** `supabase/migrations/20261111_festivales.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `festivales` (21 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_salas_catalogo|tabla salas_catalogo]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[tabla_festival_convocatorias|tabla festival_convocatorias]] *(from #schema)*
- [[tabla_festival_ediciones|tabla festival_ediciones]] *(from #schema)*

---

## 🗄️ Columnas
- `id`
- `nombre`
- `tipo_evento`
- `ciudad`
- `provincia`
- `comunidad`
- `pais`
- `generos`
- `mes_tipico`
- `primera_edicion`
- `activo`
- `web`
- `descripcion_es`
- `descripcion_en`
- `el`
- `estado_revision`
- `fuente`
- `verificado_en`
- `notas_internas`
- `created_at`
- `updated_at`

**Definida en:** `supabase/migrations/20261111_festivales.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
