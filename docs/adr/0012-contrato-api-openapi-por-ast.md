# ADR 0012: Contrato de API OpenAPI generado por análisis del AST

- **Estado:** Aceptada
- **Fecha:** 2026-10-08
- **Origen:** nueva. Implementación: `scripts/generate-openapi.mjs`; resultado: `docs/api/openapi.json`, `docs/api/REFERENCIA.md` (tablas legibles en GitHub) y `docs/api/index.html` (visor); descripciones a mano: `docs/api/overrides.json`.

## Contexto

La API tiene 352 rutas HTTP y ningún contrato: ni OpenAPI, ni librería de validación de la que derivarlo (no hay zod, joi ni similares). El README citaba el número de endpoints sin que nada lo comprobara, y un recuento por regex sobre `router.get(` resultó incompleto (routers con otro nombre, rutas declaradas con arrays de alias).

## Decisión

Un script recorre el AST de TypeScript desde `server.ts`, sigue los `router.use(...)` con sus prefijos y genera el documento OpenAPI 3.1. De **todas** las rutas documenta método, ruta completa, parámetros de ruta, cómo se autentican, limitadores de ritmo, handler y `fichero:línea`. Los esquemas de petición y respuesta solo existen en las operaciones descritas a mano en `docs/api/overrides.json` (hoy 8, marcadas con `x-esquemas: curado`).

La autenticación se clasifica por lo que el código muestra, sin adivinar (`x-autenticacion`): `middleware` (`requireAuth` y similares), `handler` (la ruta llama a `getUserFromRequest` o lee el token y responde 401), `handler-opcional`, `firma` (webhooks y URLs firmadas) y `ninguna`.

El script tiene modo `--check` para CI: falla si `docs/api/` no coincide con el código, o si una entrada de `overrides.json` apunta a una operación que ya no existe.

## Alternativas descartadas

- **zod + zod-to-openapi:** daría esquemas reales y validación en runtime, pero obliga a introducir un esquema en cada una de las 301 declaraciones. Es el destino deseable; no es un cambio de documentación.
- **swagger-jsdoc (anotaciones en comentarios):** cada anotación es una segunda copia de la ruta que se desincroniza, que es justo el problema que queremos evitar.
- **tsoa o decoradores:** exige reestructurar la API en controladores.
- **OpenAPI escrito a mano:** se queda desfasado el primer día.
- **Servir Swagger UI desde la propia app (`/api-docs`):** amplía la superficie pública del servidor. Se prefiere una página estática en `docs/api/index.html`.
- **Solo el visor HTML:** el repositorio es privado y GitHub no renderiza HTML, así que un evaluador solo vería código fuente. Por eso la referencia principal es `REFERENCIA.md`, que GitHub sí renderiza; el visor queda como complemento local.

## Consecuencias

- La cobertura es honesta pero desigual: 352 rutas con contrato de superficie, 8 con esquemas. Ampliar `overrides.json` es trabajo manual, operación a operación.
- El análisis es estático: no ve rutas registradas dinámicamente, ni handlers de controladores importados (`toursController.deleteTour`). El script informa de los casos que no puede resolver.
- Detecta de rebote cosas que antes no se veían: dos rutas declaradas dos veces (la segunda es código muerto) y rutas sombreadas por una ruta con parámetro declarada antes (`x-sombreada-por`).
- `docs/api/index.html` carga Swagger UI 5.17.14 desde jsDelivr con integridad SRI. Los hashes se calcularon sobre el paquete npm porque el proxy de desarrollo bloquea jsDelivr; si el navegador rechazara el recurso, es el primer sitio donde mirar.
