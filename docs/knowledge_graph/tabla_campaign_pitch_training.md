---
id: tabla_campaign_pitch_training
title: "tabla campaign_pitch_training"
layer: schema
domain: booking
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla campaign_pitch_training

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/booking`

## 📖 Descripción
Tabla de Supabase `campaign_pitch_training` (10 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_campaigns|tabla campaigns]] *(Layer: #schema, Domain: #system)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_pitchLearning|server/db/pitchLearning.ts]] *(from #db)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `campaign_id`
- `borrador_ia`
- `texto_aprobado`
- `tuvo_edicion`
- `diferencia_longitud`
- `tipo_accion`
- `fecha_aprobacion`
- `created_at`

**Definida en:** `supabase_schema.sql`, `supabase/migration_campaign_tone_rules.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
