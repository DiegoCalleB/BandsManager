---
id: tabla_enlaces_bandas_amigas
title: "tabla enlaces_bandas_amigas"
layer: schema
domain: system
file: "supabase/migrations/20261023_enlaces_bandas_amigas.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla enlaces_bandas_amigas

> **Ubicación:** `supabase/migrations/20261023_enlaces_bandas_amigas.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `enlaces_bandas_amigas` (7 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*

---

## 🗄️ Columnas
- `id`
- `band_contact_id`
- `band_id`
- `plataforma`
- `url`
- `verificado`
- `actualizado_at`

**Definida en:** `supabase/migrations/20261023_enlaces_bandas_amigas.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
