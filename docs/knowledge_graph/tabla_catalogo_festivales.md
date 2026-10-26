---
id: tabla_catalogo_festivales
title: "tabla catalogo_festivales"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla catalogo_festivales

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `catalogo_festivales` (21 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_catalogo_salas|tabla catalogo_salas]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[tabla_catalogo_festival_convocatorias|tabla catalogo_festival_convocatorias]] *(from #schema)*
- [[tabla_catalogo_festival_ediciones|tabla catalogo_festival_ediciones]] *(from #schema)*

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
- `sala_id`
- `estado_revision`
- `fuente`
- `verificado_en`
- `notas_internas`
- `created_at`
- `updated_at`

**Definida en:** `supabase_schema.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
