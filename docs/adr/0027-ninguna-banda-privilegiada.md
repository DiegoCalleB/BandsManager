# ADR: Ninguna banda es especial en el código

**Estado:** aceptada · **Contexto:** AGENTS.md §2 (multi-inquilino), deuda recogida en BACKLOG.md («datos de bandas concretas en el código»)

## Problema
La banda con la que nació el proyecto seguía codificada como caso especial: un id fijo usado como banda por defecto, cuentas «fundadoras» forzadas a esa banda en cada `loadState()`, la regla «evento o dato sin `band_id` = esa banda», plantillas de cliente activadas por su nombre (repertorio, EPK, merch, firma de email, onboarding), claves de sesión con su nombre (`..._token`, `..._user`, cookie) y semillas con sus datos reales (redes, correos, repertorio). Cada rama por nombre de banda es una fuga potencial entre inquilinos y un riesgo de que el dato de una banda aparezca en otra.

## Decisión
La banda es una más. En el código no queda ningún nombre, id ni asset de una banda concreta:

- **Claves de sesión y preferencias:** `localStorage` y cookie pasan a `bandmanager_*` (y la base IndexedDB de audio a `BandManagerAudioDB`). Todos los usuarios deben iniciar sesión de nuevo una vez; no se mantiene lectura doble de las claves antiguas para no conservar el nombre en el código.
- **Sin banda por defecto:** los datos sin `band_id` ya no pertenecen a nadie (el cliente los oculta; el servidor no los reasigna). Los defaults de props (`TourManager`, `AgentAutonomySettingsModal`…) pasan a vacío.
- **Sin trato especial:** fuera las cuentas fundadoras forzadas, el acceso extra del admin a esa banda, las plantillas por nombre de banda (repertorio, EPK, merch, firma, onboarding), `DEFAULT_SONGS`/`DEFAULT_SETLISTS`/roster de ejemplo y los filtros por id de canción de plantilla (ya no hay plantillas en el cliente; el servidor aísla por `band_id`).
- **Instalación nueva:** arranca con una banda de ejemplo neutra, `band-demo` («Banda Demo»), con logos `public/logo_demo*.png`, EPK de ejemplo en `server/seeds/demoEpk.ts` y datos semilla en `src/db_seed.ts`.
- **Migración de datos existentes:** `scripts/rename-band-id.ts <id_antiguo> <id_nuevo> [--apply]` reasigna el id en `data.json` y en todas las tablas con `band_id` de `supabase_schema.sql` (más `users.main_band_id` y `users.band_order`). Sin `--apply` solo simula. Es genérico: el id antiguo se pasa por argumento, no vive en el código.
- **Base de datos:** `20261101_quitar_banda_por_defecto.sql` elimina los `DEFAULT` de `band_id` que asignaban filas huérfanas a esa banda.
- **Guardia:** `server/__tests__/ningunaBandaPrivilegiada.test.ts` falla si el nombre vuelve a aparecer en `src/`, `server/`, `scripts/`, `e2e/` o `public/`.

## Cómo desplegar sin perder datos
1. `tsx scripts/rename-band-id.ts <id_antiguo> <id_nuevo>` (simulación) y revisar el recuento por tabla.
2. Repetir con `--apply` contra la base de producción y reiniciar el servidor.
3. Desplegar. Los usuarios reinician sesión una vez.

Si no se migra, las filas conservan el id antiguo y esa banda dejará de ver sus datos hasta que se ejecute el script.

## Consecuencias
- Positivas: se elimina una clase entera de fugas entre inquilinos; la lógica de acceso depende solo de `band_id` y `userBands`.
- Negativas: una sesión nueva obligatoria; se pierde la caché local de audio y las preferencias guardadas en `localStorage`.

## Excepciones deliberadas
- Migraciones SQL ya aplicadas (`20260922_data_change_history.sql`, `20261024_enlaces_bandas_amigas_*.sql`): son historia versionada; reescribirlas desincronizaría `supabase_migrations`.
- `firebase-applet-config.json`: el identificador del proyecto Firebase/OAuth es infraestructura externa en uso, no código de negocio; renombrarlo exige crear un proyecto nuevo.
- Sigue pendiente el caso especial de la cuenta de Brais Moure (`isBraisMoure`), documentado en BACKLOG.md.
