---
id: tabla_salas_catalogo
title: "tabla salas_catalogo"
layer: schema
domain: system
file: "supabase/migrations/20261108_catalogo_salas.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla salas_catalogo

> **Ubicación:** `supabase/migrations/20261108_catalogo_salas.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `salas_catalogo` (25 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_salasCatalogo|server/db/salasCatalogo.ts]] *(from #db)*
- [[tabla_festivales|tabla festivales]] *(from #schema)*
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
- `nunca`
- `telefono`
- `no`
- `puntuacion`
- `verificada_en`
- `bandas_con_entrega`
- `rebotes`
- `no_contactar`
- `motivo_no_contactar`
- `created_at`
- `updated_at`
- `estado_negocio`
- `estado_negocio_en`

**Definida en:** `supabase/migrations/20261108_catalogo_salas.sql`, `supabase/migrations/20261110_estado_negocio_salas.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
