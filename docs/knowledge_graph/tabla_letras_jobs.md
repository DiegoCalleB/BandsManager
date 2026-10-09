---
id: tabla_letras_jobs
title: "tabla letras_jobs"
layer: schema
domain: repertoire
file: "supabase/migrations/20261014_letras_automaticas.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla letras_jobs

> **Ubicación:** `supabase/migrations/20261014_letras_automaticas.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Tabla de Supabase `letras_jobs` (10 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_asistente_ia|Asistente de IA (chat)]] *(from #feature)*
- [[fn_ensayos|Ensayos]] *(from #feature)*
- [[fn_repertorio_setlists|Repertorio y setlists]] *(from #feature)*
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_services_colaLetras|server/services/colaLetras.ts]] *(from #service)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `song_id`
- `estado`
- `intentos`
- `origen`
- `error`
- `disponible_desde`
- `created_at`
- `updated_at`

**Definida en:** `supabase/migrations/20261014_letras_automaticas.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
