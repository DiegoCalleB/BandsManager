---
id: schema_supabase
title: "Supabase PostgreSQL Schema"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "postgresql", "supabase", "rls"]
---

# 📌 Supabase PostgreSQL Schema

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Esquema relacional de tablas, índices pgvector, funciones y políticas RLS.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_agent_execution_logs|tabla agent_execution_logs]] *(Layer: #schema, Domain: #system)*
- [[tabla_agent_jobs_queue|tabla agent_jobs_queue]] *(Layer: #schema, Domain: #system)*
- [[tabla_agent_schedule_state|tabla agent_schedule_state]] *(Layer: #schema, Domain: #system)*
- [[tabla_ai_token_ledger|tabla ai_token_ledger]] *(Layer: #schema, Domain: #system)*
- [[tabla_autonomy_configs|tabla autonomy_configs]] *(Layer: #schema, Domain: #system)*
- [[tabla_band_alert_settings|tabla band_alert_settings]] *(Layer: #schema, Domain: #system)*
- [[tabla_band_contacts|tabla band_contacts]] *(Layer: #schema, Domain: #system)*
- [[tabla_band_email_accounts|tabla band_email_accounts]] *(Layer: #schema, Domain: #system)*
- [[tabla_band_gmail_oauth_accounts|tabla band_gmail_oauth_accounts]] *(Layer: #schema, Domain: #auth)*
- [[tabla_band_letras_auto|tabla band_letras_auto]] *(Layer: #schema, Domain: #repertoire)*
- [[tabla_band_print_settings|tabla band_print_settings]] *(Layer: #schema, Domain: #system)*
- [[tabla_band_schedules|tabla band_schedules]] *(Layer: #schema, Domain: #system)*
- [[tabla_band_social_accounts|tabla band_social_accounts]] *(Layer: #schema, Domain: #social)*
- [[tabla_booking_campaigns|tabla booking_campaigns]] *(Layer: #schema, Domain: #booking)*
- [[tabla_calendar_conflict_notifications|tabla calendar_conflict_notifications]] *(Layer: #schema, Domain: #system)*
- [[tabla_campaign_pitch_training|tabla campaign_pitch_training]] *(Layer: #schema, Domain: #booking)*
- [[tabla_campaigns|tabla campaigns]] *(Layer: #schema, Domain: #system)*
- [[tabla_category_pitch_templates|tabla category_pitch_templates]] *(Layer: #schema, Domain: #booking)*
- [[tabla_concert_deals|tabla concert_deals]] *(Layer: #schema, Domain: #system)*
- [[tabla_concerts|tabla concerts]] *(Layer: #schema, Domain: #system)*
- [[tabla_data_change_history|tabla data_change_history]] *(Layer: #schema, Domain: #system)*
- [[tabla_deal_support_contributions|tabla deal_support_contributions]] *(Layer: #schema, Domain: #system)*
- [[tabla_deleted_bands|tabla deleted_bands]] *(Layer: #schema, Domain: #system)*
- [[tabla_deleted_leads|tabla deleted_leads]] *(Layer: #schema, Domain: #booking)*
- [[tabla_enlaces_bandas_amigas|tabla enlaces_bandas_amigas]] *(Layer: #schema, Domain: #system)*
- [[tabla_epk_configs|tabla epk_configs]] *(Layer: #schema, Domain: #epk)*
- [[tabla_fan_link_clicks|tabla fan_link_clicks]] *(Layer: #schema, Domain: #social)*
- [[tabla_fans|tabla fans]] *(Layer: #schema, Domain: #social)*
- [[tabla_gear_checklists|tabla gear_checklists]] *(Layer: #schema, Domain: #system)*
- [[tabla_lead_messages|tabla lead_messages]] *(Layer: #schema, Domain: #booking)*
- [[tabla_leads|tabla leads]] *(Layer: #schema, Domain: #booking)*
- [[tabla_letras_jobs|tabla letras_jobs]] *(Layer: #schema, Domain: #repertoire)*
- [[tabla_messages|tabla messages]] *(Layer: #schema, Domain: #system)*
- [[tabla_metricas_bandas_amigas|tabla metricas_bandas_amigas]] *(Layer: #schema, Domain: #system)*
- [[tabla_musicians_waitlist|tabla musicians_waitlist]] *(Layer: #schema, Domain: #system)*
- [[tabla_payments|tabla payments]] *(Layer: #schema, Domain: #finances)*
- [[tabla_pitch_example_threads|tabla pitch_example_threads]] *(Layer: #schema, Domain: #booking)*
- [[tabla_pitch_learning_examples|tabla pitch_learning_examples]] *(Layer: #schema, Domain: #booking)*
- [[tabla_pitch_vector_store|tabla pitch_vector_store]] *(Layer: #schema, Domain: #booking)*
- [[tabla_reel_analyses|tabla reel_analyses]] *(Layer: #schema, Domain: #social)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*
- [[tabla_rehearsals|tabla rehearsals]] *(Layer: #schema, Domain: #system)*
- [[tabla_run_of_show|tabla run_of_show]] *(Layer: #schema, Domain: #system)*
- [[tabla_saved_filters|tabla saved_filters]] *(Layer: #schema, Domain: #system)*
- [[tabla_schema_migrations|tabla schema_migrations]] *(Layer: #schema, Domain: #system)*
- [[tabla_setlist_shortcuts|tabla setlist_shortcuts]] *(Layer: #schema, Domain: #repertoire)*
- [[tabla_setlists|tabla setlists]] *(Layer: #schema, Domain: #repertoire)*
- [[tabla_short_link_clicks|tabla short_link_clicks]] *(Layer: #schema, Domain: #system)*
- [[tabla_short_links|tabla short_links]] *(Layer: #schema, Domain: #system)*
- [[tabla_social_content_items|tabla social_content_items]] *(Layer: #schema, Domain: #social)*
- [[tabla_social_metrics|tabla social_metrics]] *(Layer: #schema, Domain: #social)*
- [[tabla_social_posts|tabla social_posts]] *(Layer: #schema, Domain: #social)*
- [[tabla_song_stems_cache|tabla song_stems_cache]] *(Layer: #schema, Domain: #repertoire)*
- [[tabla_songs|tabla songs]] *(Layer: #schema, Domain: #repertoire)*
- [[tabla_stem_prediction_jobs|tabla stem_prediction_jobs]] *(Layer: #schema, Domain: #repertoire)*
- [[tabla_stem_storage_retry_queue|tabla stem_storage_retry_queue]] *(Layer: #schema, Domain: #repertoire)*
- [[tabla_stripe_webhook_events|tabla stripe_webhook_events]] *(Layer: #schema, Domain: #finances)*
- [[tabla_tours|tabla tours]] *(Layer: #schema, Domain: #system)*
- [[tabla_user_bands|tabla user_bands]] *(Layer: #schema, Domain: #system)*
- [[tabla_users|tabla users]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_agent_schedule|Estado del Scheduler de agentes]] *(from #db)*
- [[db_ai_ledger|AI Token Ledger]] *(from #db)*
- [[db_lead_messages|Lead Messages & Thread DB]] *(from #db)*
- [[db_leads|Leads DB Handlers]] *(from #db)*
- [[db_payments|Pagos y suscripciones (Stripe)]] *(from #db)*
- [[db_repertoire|Repertoire DB Handlers]] *(from #db)*
- [[db_state_sync|In-Memory State & Supabase Sync]] *(from #db)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
