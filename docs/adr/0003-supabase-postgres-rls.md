# ADR 0003: Supabase (Postgres) con RLS

- **Estado:** Aceptada
- **Fecha:** 2026-10-06 (primer commit del fichero; el historial de git empieza ese día, la decisión puede ser anterior)
- **Origen:** retroactiva. Fuentes: `supabase/migrations/` (políticas RLS), migraciones `restrict_rls_to_service_role` y `enable_rls_stem_tables` en el proyecto `BandManagement`, `server/db/*.ts`.

## Contexto

Necesitamos Postgres gestionado, con copias de seguridad, un panel para operar y RLS para que los datos de una banda no sean legibles desde el cliente aunque falle la aplicación.

## Decisión

Postgres en Supabase (región `eu-west-1`). RLS habilitado en todas las tablas públicas: en el proyecto de producción, las 57 tablas tienen `rls_enabled = true`. El acceso de la aplicación pasa por el servidor con la clave de servicio; el cliente no escribe directamente en tablas de negocio. La migración `restrict_rls_to_service_role` (según su nombre; no se ha revisado su SQL) restringe las políticas al rol de servicio.

## Alternativas descartadas

- **Postgres autogestionado en Railway:** más control, pero hay que montar backups, RLS con auth propio y panel.
- **Firebase (Firestore):** el modelo documental no encaja bien con las relaciones entre bandas, salas, leads y setlists; y el proyecto arrastra una config heredada de Firebase (`firebase-applet-config.json`) que no es la BD activa.
- **Supabase escribiendo desde el cliente con RLS por usuario:** se descartó porque la lógica de multi-banda y de límites de plan debe ejecutarse en servidor ([ADR 0004](./0004-band-id-resuelto-en-servidor.md)).

## Consecuencias

- Las políticas RLS son una defensa en profundidad: la barrera principal es el servidor.
- El `schema` vive en varios sitios: ver [ADR 0008](./0008-migraciones-sql-versionadas.md).
- Hay una deuda: `firebase-applet-config.json` y la dependencia de Firebase siguen en el repo (`package.json`, `src/utils/googleAuth.ts`, `server/utils/googleVerify.ts`). Conviene confirmar si se usan y retirar lo que sobre.
