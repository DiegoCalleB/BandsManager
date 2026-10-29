---
id: tabla_band_estrategia_marketing
title: "tabla band_estrategia_marketing"
layer: schema
domain: system
file: "supabase/migrations/20261122_band_estrategia_marketing.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla band_estrategia_marketing

> **Ubicación:** `supabase/migrations/20261122_band_estrategia_marketing.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `band_estrategia_marketing` (5 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_asesorMarketing|server/db/asesorMarketing.ts]] *(from #db)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `estrategia`
- `created_at`
- `updated_at`

**Definida en:** `supabase/migrations/20261122_band_estrategia_marketing.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
