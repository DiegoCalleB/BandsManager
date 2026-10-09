---
id: tabla_epk_configs
title: "tabla epk_configs"
layer: schema
domain: epk
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla epk_configs

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/epk`

## 📖 Descripción
Tabla de Supabase `epk_configs` (35 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_epk|server/db/epk.ts]] *(from #db)*
- [[server_routes_tracking|server/routes/tracking.ts]] *(from #route)*

---

## 🗄️ Columnas
- `band_id`
- `biografia`
- `logo_url`
- `dossier_pdf_url`
- `dossier_pdf_name`
- `dossier_document_url`
- `dossier_document_name`
- `dossier_texto_extra`
- `band_photos`
- `rider_tecnico`
- `rider_pdf_url`
- `rider_pdf_name`
- `enlaces_redes`
- `contacto_booking`
- `temas_destacados_ids`
- `incentivo_fans`
- `donacion_revolut`
- `ciudades_config`
- `firma_email`
- `miembros`
- `videos`
- `datos_contratacion`
- `traducciones`
- `plantilla`
- `orden_secciones`
- `secciones_ocultas`
- `updated_at`
- `genero`
- `frase_impacto`
- `bandas_similares`
- `mostrar_bandas_similares`
- `rider_config`
- `idioma`
- `font_style`
- `tipografia`

**Definida en:** `supabase_schema.sql`, `supabase_migration_only_new.sql`, `supabase/migrations/20260909_add_epk_plantilla_and_sections.sql`, `supabase/migrations/20261005_epk_configs_campos_editables.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
