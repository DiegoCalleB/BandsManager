# ADR 0008: Migraciones SQL versionadas en `supabase/migrations/`

- **Estado:** Propuesta (pendiente de decisión del equipo)
- **Fecha:** 2026-10-08
- **Origen:** retroactiva + nueva. Fuentes: `scripts/migrate.ts` (lee `supabase/migrations`), `server/migrations/runner.ts`, `supabase/*.sql` (12 ficheros sueltos), `supabase/migrations/` (40 ficheros), registro de migraciones del proyecto `BandManagement` en Supabase.

## Contexto

El esquema de la base de datos se cambia con ficheros SQL. Hoy conviven tres sitios:

1. `supabase/migrations/`: 40 ficheros. Los aplica el runner en `npm start` (`scripts/migrate.ts`, con `DATABASE_URL`).
2. `supabase/*.sql`: 12 ficheros sueltos. **El runner no los lee.** Se aplican a mano, o no se aplican.
3. El registro de migraciones de Supabase en producción (36 entradas) usa **otros nombres y otros timestamps**. Por ejemplo, `add_energia_db_promedio` figura en el repo como `20260903_add_energia_db_promedio.sql` y en producción con versión `20260904055504`. Eso impide saber con certeza qué sueltas están aplicadas.

Cruce por nombre: `campaign_pitch_template` y `negotiation_start_cache` aparecen en producción; las otras 10 sueltas no aparecen por nombre. Esto no prueba que no estén aplicadas (pueden estar con otro nombre), solo que no se puede confirmar desde el repo.

## Decisión propuesta

1. **Una sola fuente de verdad:** `supabase/migrations/`. Las 12 sueltas se mueven allí con timestamp, tras comprobar en producción cuáles están aplicadas.
2. **Un solo registro:** el que use el runner del repo, o el de Supabase CLI, pero no los dos.
3. Cada migración nueva incluye un comentario con el ADR o la razón del cambio.

Decisión que necesito del equipo antes de tocar nada: confirmar, para cada suelta, si está aplicada en producción. Mover ficheros sin esa comprobación no cambia el repo, pero sí el riesgo de volver a aplicar algo a medias.

## Alternativas descartadas

- **Dejarlo como está:** la pregunta «¿qué esquema tiene producción?» no tiene respuesta única.
- **Solo la CLI de Supabase:** válido, pero cambia el flujo de despliegue que hoy arranca en Railway.

## Consecuencias

- Hasta resolverse, el README ya avisa de que los `.sql` sueltos no se aplican solos.
- Riesgo abierto: una migración suelta no aplicada puede hacer fallar una funcionalidad concreta en producción.
