---
id: tabla_leads
title: "tabla leads"
layer: schema
domain: booking
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla leads

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/booking`

## 📖 Descripción
Tabla de Supabase `leads` (65 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(from #agent)*
- [[agent_lector|Lector Agent (Listener)]] *(from #agent)*
- [[db_leads|Leads DB Handlers]] *(from #db)*
- [[fn_acceso_sesion|Acceso y sesión]] *(from #feature)*
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[fn_asistente_ia|Asistente de IA (chat)]] *(from #feature)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[fn_fans_epk|Fans y EPK]] *(from #feature)*
- [[fn_scout_salas|Búsqueda de salas y festivales]] *(from #feature)*
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_fans|server/db/fans.ts]] *(from #db)*
- [[server_db_pitchLearning|server/db/pitchLearning.ts]] *(from #db)*
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(from #route)*
- [[server_routes_tracking|server/routes/tracking.ts]] *(from #route)*
- [[tabla_concert_deals|tabla concert_deals]] *(from #schema)*
- [[tabla_lead_messages|tabla lead_messages]] *(from #schema)*
- [[tabla_pitch_vector_store|tabla pitch_vector_store]] *(from #schema)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `nombre_sala`
- `ciudad`
- `region`
- `direccion`
- `aforo`
- `genero`
- `tipo`
- `email_contacto`
- `email_secundario`
- `telefono`
- `telefono_movil`
- `telefono_fijo`
- `website`
- `instagram`
- `contacto_nombre`
- `fuente`
- `estado`
- `pitch_generado`
- `fecha_envio`
- `fecha_ultima_respuesta`
- `contexto_extra`
- `notas`
- `icono`
- `imagen_url`
- `es_favorito`
- `es_verificado`
- `fiabilidad_score`
- `pitch_feedback_tono`
- `pitch_feedback_contenido`
- `pitch_feedback_comentario`
- `historial_feedback_pitch`
- `historial_contacto`
- `pero`
- `roster`
- `festival_start_date`
- `festival_end_date`
- `fechas_ocupadas`
- `fechas_libres_detectadas`
- `temperatura_lead`
- `ultimo_sentimiento`
- `ultimo_sentimiento_score`
- `ultimo_sentimiento_label`
- `ultima_intencion`
- `ultima_intencion_etiqueta`
- `ultimas_objeciones`
- `ultimo_analisis_resumen`
- `fechas_propuestas_sala`
- `condiciones_economicas_detectadas`
- `estrategia_playbook`
- `ultimo_mensaje_recibido`
- `gmail_draft_id`
- `created_at`
- `updated_at`
- `hilo_emails`
- `thread_id`
- `gmail_thread_id`
- `gmail_message_id`
- `place_id`
- `clics_epk`
- `ultimo_clic_at`
- `email_abierto`
- `veces_abierto`
- `ultimo_abierto_at`

**Definida en:** `supabase_schema.sql`, `supabase_migration_only_new.sql`, `supabase/migration_add_email_secundario_to_leads.sql`, `supabase/migration_gmail_thread_id.sql`, `supabase/migrations/20260923_add_telefono_movil_fijo_to_leads.sql`, `supabase/migrations/20260924_add_ai_deal_analysis_to_leads.sql`, `supabase/migrations/20261009_sincronizar_esquema_auditoria.sql`, `supabase/postgres_trigger_respuesta_inmediata.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
