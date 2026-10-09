---
id: tabla_registered_bands
title: "tabla registered_bands"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla registered_bands

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `registered_bands` (32 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(from #agent)*
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_bands|server/db/bands.ts]] *(from #db)*
- [[server_db_epk|server/db/epk.ts]] *(from #db)*
- [[server_db_referidos|server/db/referidos.ts]] *(from #db)*
- [[server_db_social|server/db/social.ts]] *(from #db)*
- [[server_db_users|server/db/users.ts]] *(from #db)*
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*
- [[server_routes_bands|server/routes/bands.ts]] *(from #route)*
- [[server_routes_billing|server/routes/billing.ts]] *(from #route)*
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(from #route)*
- [[server_routes_gmailOAuth|server/routes/gmailOAuth.ts]] *(from #security)*
- [[server_services_emailAgentClient|server/services/emailAgentClient.ts]] *(from #agent)*
- [[tabla_agent_execution_logs|tabla agent_execution_logs]] *(from #schema)*
- [[tabla_agent_jobs_queue|tabla agent_jobs_queue]] *(from #schema)*
- [[tabla_ai_token_ledger|tabla ai_token_ledger]] *(from #schema)*
- [[tabla_autonomy_configs|tabla autonomy_configs]] *(from #schema)*
- [[tabla_band_contacts|tabla band_contacts]] *(from #schema)*
- [[tabla_band_email_accounts|tabla band_email_accounts]] *(from #schema)*
- [[tabla_band_gmail_oauth_accounts|tabla band_gmail_oauth_accounts]] *(from #schema)*
- [[tabla_campaign_pitch_training|tabla campaign_pitch_training]] *(from #schema)*
- [[tabla_campaigns|tabla campaigns]] *(from #schema)*
- [[tabla_category_pitch_templates|tabla category_pitch_templates]] *(from #schema)*
- [[tabla_concert_deals|tabla concert_deals]] *(from #schema)*
- [[tabla_concerts|tabla concerts]] *(from #schema)*
- [[tabla_deal_support_contributions|tabla deal_support_contributions]] *(from #schema)*
- [[tabla_deleted_bands|tabla deleted_bands]] *(from #schema)*
- [[tabla_deleted_leads|tabla deleted_leads]] *(from #schema)*
- [[tabla_enlaces_bandas_amigas|tabla enlaces_bandas_amigas]] *(from #schema)*
- [[tabla_epk_configs|tabla epk_configs]] *(from #schema)*
- [[tabla_fans|tabla fans]] *(from #schema)*
- [[tabla_gear_checklists|tabla gear_checklists]] *(from #schema)*
- [[tabla_lead_messages|tabla lead_messages]] *(from #schema)*
- [[tabla_leads|tabla leads]] *(from #schema)*
- [[tabla_messages|tabla messages]] *(from #schema)*
- [[tabla_metricas_bandas_amigas|tabla metricas_bandas_amigas]] *(from #schema)*
- [[tabla_payments|tabla payments]] *(from #schema)*
- [[tabla_pitch_example_threads|tabla pitch_example_threads]] *(from #schema)*
- [[tabla_pitch_learning_examples|tabla pitch_learning_examples]] *(from #schema)*
- [[tabla_pitch_vector_store|tabla pitch_vector_store]] *(from #schema)*
- [[tabla_reel_analyses|tabla reel_analyses]] *(from #schema)*
- [[tabla_rehearsals|tabla rehearsals]] *(from #schema)*
- [[tabla_run_of_show|tabla run_of_show]] *(from #schema)*
- [[tabla_saved_filters|tabla saved_filters]] *(from #schema)*
- [[tabla_setlist_shortcuts|tabla setlist_shortcuts]] *(from #schema)*
- [[tabla_setlists|tabla setlists]] *(from #schema)*
- [[tabla_social_content_items|tabla social_content_items]] *(from #schema)*
- [[tabla_social_metrics|tabla social_metrics]] *(from #schema)*
- [[tabla_social_posts|tabla social_posts]] *(from #schema)*
- [[tabla_song_stems_cache|tabla song_stems_cache]] *(from #schema)*
- [[tabla_songs|tabla songs]] *(from #schema)*
- [[tabla_stem_prediction_jobs|tabla stem_prediction_jobs]] *(from #schema)*
- [[tabla_stem_storage_retry_queue|tabla stem_storage_retry_queue]] *(from #schema)*
- [[tabla_tours|tabla tours]] *(from #schema)*
- [[tabla_user_bands|tabla user_bands]] *(from #schema)*
- [[tabla_users|tabla users]] *(from #schema)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `user_id`
- `fecha_registro`
- `nombre_banda`
- `email`
- `plan`
- `contacto_nombre`
- `estilo_musical`
- `localizacion`
- `telefono`
- `instagram`
- `spotify_youtube`
- `aforo_promedio`
- `estado_cuenta`
- `notas`
- `radar_enabled`
- `last_social_radar_at`
- `dna_expresion`
- `created_at`
- `updated_at`
- `tier`
- `plan_pendiente`
- `fecha_cambio_plan`
- `estado_suscripcion`
- `creditos_periodo`
- `creditos_usados`
- `logo_url`
- `imagen_url`
- `ref_code`
- `referido_por`
- `referido_en`

**Definida en:** `supabase_schema.sql`, `supabase_migration_only_new.sql`, `supabase/migrations/20260915_ai_token_ledger_band_scope.sql`, `supabase/migrations/20261009_sincronizar_esquema_auditoria.sql`, `supabase/migrations/20261016_referidos_banda.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
