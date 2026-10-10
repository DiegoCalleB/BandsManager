# ADR: Quitar del código las bandas del antiguo proyecto de ejemplo

**Estado:** aceptada · **Contexto:** continuación de [0027](./0027-ninguna-banda-privilegiada.md); ninguna banda es especial en el código

## Problema
Dos bandas reales del proyecto de ejemplo seguían incrustadas en el código como casos especiales:
- `src/data/mouredevBandsSeed.ts` (2343 líneas de leads, conciertos, giras, pagos, fans y posts) se mezclaba en `db_seed.ts` y daba de alta las dos bandas en `registeredBands` cuando no había Supabase.
- `server/auth.ts` y `server/routes/users.ts` forzaban esas dos bandas (y una como banda por defecto, además de plan y rol) a la cuenta de su propietario, con una utilidad `esCuentaDeBrais` y una variable `BRAIS_EMAILS`.
- `server/state.ts` reescribía el `band_id` de esa cuenta en cada arranque.

Eso es privilegio por banda y por cuenta: lo contrario de un sistema multi-tenant donde todas las bandas son iguales.

## Decisión
- Se elimina el seed, sus constantes (`*_REGISTERED_BAND`, `*_EPK_CONFIG`), `ensureMouredevBandsData` (ya era un no-op) y todos los usuarios y filas semilla de esas bandas.
- Se elimina `esCuentaDeBrais` y todo su uso: las bandas de una cuenta salen únicamente de sus propias membresías (`user_bands` en Supabase), igual que para cualquier otra.
- **Se mantiene la cuenta `mouredev@gmail.com`** como un usuario semilla más, sin banda, plan ni instrumento forzados. Sus bandas y su plan no dependen del código: viven en la base de datos.
- Los fixtures de tests usan «Banda Ejemplo».
- `ningunaBandaPrivilegiada.test.ts` pasa a vigilar también estos nombres e ids.
- **Backup:** `docs/backups/mouredev-seed-2026-10-10.tar.gz` guarda los archivos originales (seed, `db_seed.ts`, `state.ts`, `auth.ts`, `users.ts` y `cuentaBrais`). No es código importable ni forma parte del build.

## Consecuencias
- Una instalación local nueva ya no arranca con los datos de esas dos bandas, solo con `band-demo`.
- No hace falta migración: los ids de banda en Supabase no cambian.
- Se pierde el atajo que daba por defecto plan `cabeza_de_cartel` y la banda «principal» a esa cuenta; si en Supabase su plan o sus bandas estuvieran vacíos, deben corregirse en los datos, no en el código.

## Pendiente (fuera de este ADR)
- El texto de marketing de `PublicTfmLanding.tsx` y `LandingChatWidget.tsx` cuenta el caso de uso real de esas bandas; no contiene lógica y está exento en el test de guarda. Decidir si se reescribe como caso genérico.
- `server/state.ts` aún fuerza la cuenta `Admin` a la banda `band-vertice`: otra banda privilegiada por resolver.

## Versionado: 3.0.0
Junto con [0027](./0027-ninguna-banda-privilegiada.md), este cambio es **incompatible** según AGENTS.md §7 (una migración que exige intervención manual y quitar una funcionalidad), aunque sus commits llevaran el tipo `refactor`. Por eso la versión salta de `2.0.0` a `3.0.0` (`Release-As: 3.0.0` en el commit que lo marca).

Qué rompe para quien ya despliega:
- **Sesión:** `localStorage`, cookie e IndexedDB de audio pasan a `bandmanager_*` / `BandManagerAudioDB`; todos los usuarios inician sesión de nuevo una vez y se pierde la caché local de audio.
- **Datos sin `band_id`:** ya no pertenecen a ninguna banda; la base de datos pierde los `DEFAULT` de `band_id` (migración `20261101_quitar_banda_por_defecto.sql`) y los ids antiguos se migran con `scripts/rename-band-id.ts`.
- **Cuentas con trato especial:** ninguna cuenta recibe ya bandas, plan ni instrumento por defecto desde el código; su acceso depende solo de sus membresías.
- **Instalación nueva:** arranca solo con `band-demo`.
