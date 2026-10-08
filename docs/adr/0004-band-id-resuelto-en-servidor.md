# ADR 0004: `band_id` resuelto siempre en servidor

- **Estado:** Aceptada
- **Fecha:** anterior a 2026-10-08 (no consta en el repo)
- **Origen:** retroactiva. Fuentes: `server/utils/bandAccess.ts` (`getTargetBandId`), `server/db/__tests__/bandIdTrustBoundary.test.ts`, `.github/pull_request_template.md`, AGENTS.md §2.1.

## Contexto

Una cuenta puede pertenecer a varias bandas. Si el cliente envía el `band_id` en el cuerpo de la petición, un usuario podría leer o escribir datos de otra banda cambiándolo a mano.

## Decisión

Toda ruta que lee o escribe datos de banda obtiene el `band_id` con `getTargetBandId(req)` en `server/utils/bandAccess.ts:18`, que valida la pertenencia del usuario. Nunca se toma de `req.body.bandId` ni de la cabecera directamente. Las funciones `dbUpsertX` reciben el `band_id` ya resuelto y no lo recalculan desde el objeto recibido.

Se hace cumplir con un test que falla si aparece el patrón prohibido (`bandIdTrustBoundary.test.ts`) y con una casilla obligatoria en el PR template.

## Alternativas descartadas

- **Confiar en `req.body.bandId` y validar pertenencia en cada consulta:** es fácil olvidar la validación en una ruta nueva. Se prefiere un único punto de resolución.
- **Solo RLS en Postgres:** la aplicación usa la clave de servicio, que se salta RLS; por eso la barrera está en código.

## Consecuencias

- Una ruta nueva que olvide `getTargetBandId` es el fallo más probable. Lo detectan el test y el PR template, no el compilador.
- Es el ADR que más debería tener un test de contrato por cada ruta; hoy el test cubre el patrón, no cada endpoint.
