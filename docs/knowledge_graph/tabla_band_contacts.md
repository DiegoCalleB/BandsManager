---
id: tabla_band_contacts
title: "tabla band_contacts"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla band_contacts

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `band_contacts` (24 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_contacts|server/db/contacts.ts]] *(from #db)*
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(from #route)*
- [[tabla_enlaces_bandas_amigas|tabla enlaces_bandas_amigas]] *(from #schema)*
- [[tabla_metricas_bandas_amigas|tabla metricas_bandas_amigas]] *(from #schema)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `nombre_banda`
- `estilo_musical`
- `localizacion`
- `estado_relacion`
- `ultimo_contacto`
- `contacto_nombre`
- `email`
- `telefono`
- `instagram`
- `spotify_youtube`
- `aforo_promedio`
- `notas_colaboracion`
- `ciudad_origen_swap`
- `icono`
- `imagen_url`
- `es_favorito`
- `es_verificado`
- `fiabilidad_score`
- `estilo_comunicacion`
- `dna_expresion`
- `created_at`
- `updated_at`

**Definida en:** `supabase_schema.sql`, `supabase_migration_only_new.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
