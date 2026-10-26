---
id: tabla_catalogo_salas
title: "tabla catalogo_salas"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla catalogo_salas

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `catalogo_salas` (33 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_salasCatalogo|server/db/salasCatalogo.ts]] *(from #db)*
- [[server_db_salasPublicas|server/db/salasPublicas.ts]] *(from #db)*
- [[tabla_catalogo_festivales|tabla catalogo_festivales]] *(from #schema)*
- [[tabla_catalogo_sala_generos|tabla catalogo_sala_generos]] *(from #schema)*
- [[tabla_catalogo_staging|tabla catalogo_staging]] *(from #schema)*
- [[tabla_catalogo_supresion|tabla catalogo_supresion]] *(from #schema)*
- [[tabla_leads|tabla leads]] *(from #schema)*

---

## 🗄️ Columnas
- `id`
- `clave`
- `place_id`
- `nombre`
- `ciudad`
- `region`
- `direccion`
- `tipo`
- `aforo`
- `genero`
- `website`
- `instagram`
- `email_contacto`
- `telefono`
- `nivel`
- `puntuacion`
- `verificada_en`
- `bandas_con_respuesta`
- `bandas_con_entrega`
- `rebotes`
- `no_contactar`
- `motivo_no_contactar`
- `created_at`
- `updated_at`
- `estado_negocio`
- `estado_negocio_en`
- `fuentes`
- `pais`
- `lat`
- `lon`
- `web_revisada_en`
- `coordenadas_aprox`
- `geolocalizada_en`

**Definida en:** `supabase_schema.sql`, `supabase/migrations/20261117_sala_web_revisada.sql`, `supabase/migrations/20261118_sala_coordenadas.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
