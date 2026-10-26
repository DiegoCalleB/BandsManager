---
id: tabla_campaigns
title: "tabla campaigns"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla campaigns

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `campaigns` (18 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[fn_asistente_ia|Asistente de IA (chat)]] *(from #feature)*
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_campaigns|server/db/campaigns.ts]] *(from #db)*
- [[server_db_pitchLearning|server/db/pitchLearning.ts]] *(from #db)*
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*
- [[tabla_campaign_pitch_training|tabla campaign_pitch_training]] *(from #schema)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `name`
- `target_cities`
- `min_capacity`
- `max_capacity`
- `target_dates`
- `target_dates_text`
- `notes`
- `custom_pitch_templates`
- `campaign_tone_rules`
- `is_active`
- `color`
- `created_at`
- `updated_at`
- `campaign_start_date`
- `campaign_end_date`
- `min_cache_by_type`

**Definida en:** `supabase_schema.sql`, `supabase/migration_campaign_pitch_template.sql`, `supabase/migration_campaign_tone_rules.sql`, `supabase/migrations/20261102_columnas_escritas_sin_migracion.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
