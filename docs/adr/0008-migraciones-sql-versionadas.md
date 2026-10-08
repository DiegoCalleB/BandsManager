# ADR 0008: Migraciones SQL versionadas en `supabase/migrations/`

- **Estado:** Propuesta (pendiente de decisión del equipo)
- **Fecha:** 2026-10-08
- **Origen:** retroactiva + nueva. Fuentes: `scripts/migrate.ts` (lee `supabase/migrations`), `server/migrations/runner.ts`, `supabase/*.sql` (12 ficheros sueltos), `supabase/migrations/` (40 ficheros), registro de migraciones del proyecto `BandManagement` en Supabase.

## Contexto

El esquema de la base de datos se cambia con ficheros SQL. Hoy conviven tres sitios:

1. `supabase/migrations/`: 40 ficheros. Los aplica el runner en `npm start` (`scripts/migrate.ts`, con `DATABASE_URL`).
2. `supabase/*.sql`: 12 ficheros sueltos. **El runner no los lee.** Se aplican a mano, o no se aplican.
3. El registro de migraciones de Supabase en producción (36 entradas) usa **otros nombres y otros timestamps**. Por ejemplo, `add_energia_db_promedio` figura en el repo como `20260903_add_energia_db_promedio.sql` y en producción con versión `20260904055504`. Eso impedía saberlo desde el repo; se ha comprobado directamente en la base de datos (tabla abajo).

Comprobación en producción (`BandManagement`, consulta de solo lectura a `information_schema` y `pg_trigger`, 2026-10-08):

| Fichero suelto | Objeto que crea o modifica | ¿Está en producción? |
|---|---|---|
| `migration_add_email_secundario_to_leads.sql` | `leads.email_secundario` | Sí |
| `migration_agent_sender_emails.sql` | `autonomy_configs.agent_sender_email`, `agent_sender_name`, `agent_reply_to_email` | Sí |
| `migration_campaign_pitch_template.sql` | `campaigns.custom_pitch_templates` | Sí |
| `migration_campaign_tone_rules.sql` | `campaigns.campaign_tone_rules` | Sí |
| `migration_fan_link_clicks.sql` | tabla `fan_link_clicks` | Sí |
| `migration_gmail_thread_id.sql` | `leads.gmail_thread_id`, `gmail_message_id` | Sí |
| `migration_musicians_waitlist.sql` | tabla `musicians_waitlist` | Sí |
| `migration_negotiation_start_cache.sql` | `autonomy_configs.negotiation_start_cache_by_type` | Sí |
| `migration_response_strategies.sql` | `autonomy_configs.response_strategies` | Sí |
| `migration_song_energia_variacion.sql` | `songs.energia_variacion`, `energia_variacion_calculada_en` | Sí |
| `migration_user_ui_preferences.sql` | `users.ui_preferences` | Sí |
| `postgres_trigger_respuesta_inmediata.sql` | `leads.thread_id`, función y trigger `tr_enviar_respuesta_lead` | **No** |

Once de las doce están aplicadas. La que no lo está (respuesta inmediata por trigger) no tiene ninguna referencia en el código: la aplicación usa `gmail_thread_id`, no `thread_id`. Es SQL muerto probable, pero no se ha borrado.

Por qué no se mueven los ficheros aplicados sin más: el runner ejecuta todo lo que haya en `supabase/migrations/` y registra en su propia tabla. Si esa tabla no existe en producción, en el siguiente despliegue volvería a ejecutar los 40 ficheros. Los `IF NOT EXISTS` lo harían inocuo en la mayoría de los casos, pero no se ha verificado el registro del runner en producción.

## Decisión propuesta

1. **Una sola fuente de verdad:** `supabase/migrations/`. Las 12 sueltas se mueven allí con timestamp, tras comprobar en producción cuáles están aplicadas.
2. **Un solo registro:** el que use el runner del repo, o el de Supabase CLI, pero no los dos.
3. Cada migración nueva incluye un comentario con el ADR o la razón del cambio.

Decisión que necesito del equipo: qué hacer con la suelta no aplicada (¿se archiva o se aplica?) y en qué orden se normaliza el registro del runner antes de mover ficheros.

## Alternativas descartadas

- **Dejarlo como está:** la pregunta «¿qué esquema tiene producción?» no tiene respuesta única.
- **Solo la CLI de Supabase:** válido, pero cambia el flujo de despliegue que hoy arranca en Railway.

## Consecuencias

- Hasta resolverse, el README ya avisa de que los `.sql` sueltos no se aplican solos.
- Riesgo abierto: una migración suelta no aplicada puede hacer fallar una funcionalidad concreta en producción.
