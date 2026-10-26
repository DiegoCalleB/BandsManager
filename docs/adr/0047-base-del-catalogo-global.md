# ADR 0047: Preparar el catálogo de salas para ser global sin tocar lo que ya funciona

> **Nota (ADR 0048):** la tabla `salas_catalogo` se llama ahora `catalogo_salas`; el renombrado que aquí se descartó se hizo después como refactor aparte.

- **Estado:** Aceptada
- **Fecha:** 2026-10-19
- **Origen:** nueva

## Contexto

El catálogo compartido (ADR 0044) y los directorios públicos (ADR 0045 y 0046) nacieron para España y se alimentan de los leads de las bandas y de OpenStreetMap. Para crecer a otros países, estilos y fuentes abiertas (Wikidata, MusicBrainz) faltan cuatro cosas: saber el país y la posición de cada sala, un vocabulario común de géneros (hoy `genero` es texto libre: «Música en vivo / Deportes / Espectáculos»), un sitio donde dejar lo que trae una fuente antes de que toque el catálogo, y una lista de emails que nadie debe volver a contactar. La web y los agentes ya dependen de `salas_catalogo`, `festivales` y `leads` por nombre, así que nada de esto puede cambiar su forma.

## Decisión

Una migración **solo aditiva** (`20261113_catalogo_global_base.sql`), sin cambios de comportamiento: ningún código la usa todavía.

- **`salas_catalogo` gana `pais`, `lat` y `lon`.** `pais` vale `ES` por defecto, que es lo que son todas las salas actuales y lo que escribe la sincronización sin saberlo. Ningún `CHECK` nuevo en tablas existentes: el servidor ya escribe tipos como `espacio_cultural` y un `CHECK` los rechazaría.
- **Taxonomía de géneros** (`catalogo_generos`, `catalogo_generos_alias`, `catalogo_sala_generos`): ids estables con padre opcional (punk → rock), nombres en español e inglés, y alias ya normalizados con `normalizarTexto` para convertir el texto libre. Los ids de Wikidata y MusicBrainz se rellenan cuando se comprueban, nunca a ciegas.
- **Ingestas con staging** (`catalogo_ingestas`, `catalogo_staging`): cada ejecución de una fuente queda registrada y sus filas esperan en staging con su licencia. La identidad la sigue decidiendo `claveSala` (ADR 0044): lo que no encaja por clave queda en «revisar», no se adivina.
- **Supresión global** (`catalogo_supresion`): el SHA-256 del email, no el email, con un motivo cerrado (baja, queja, rebote permanente, petición legal).
- **Prefijo `catalogo_`** para todas las tablas nuevas; las existentes conservan su nombre.
- RLS activada y sin políticas, como el resto del catálogo: solo el servidor lee y escribe.

## Alternativas descartadas

- **Renombrar `salas_catalogo` y `festivales*` a `catalogo_*` con vistas de compatibilidad.** Agrupa mejor, pero `server/db/festivales.ts`, el SEO y la sincronización los usan por nombre; una vista olvidada rompe una página pública. Si algún día compensa, será un refactor aparte con su cambio de código.
- **Resolver duplicados por similitud de nombre, dominio o distancia.** Más cobertura, pero contradice ADR 0044: un falso positivo mezcla dos salas y sus contactos.
- **Tabla de contactos separada.** El contacto ya vive en `salas_catalogo` y solo sale al añadir (ADR 0044); duplicarlo crea dos verdades que se descuadran.
- **Lógica en la base de datos (funciones, triggers).** El dominio del catálogo vive en TypeScript con puerto y tests (`server/services/catalogoSalas.ts`); partirlo entre SQL y TypeScript haría dos sitios donde mirar.

## Consecuencias

- Hoy no cambia nada visible: la web, los agentes y los leads funcionan igual. Lo comprueban `server/migrations/__tests__/catalogoGlobal.test.ts` y las auditorías de `server/audit`.
- Los siguientes pasos van en PR aparte y con sus tests: rellenar `catalogo_sala_generos` desde el texto libre, una fuente de Wikidata que escriba solo en staging y promueva con la sincronización existente (`fuentes`), y que el envío consulte la supresión antes de mandar.
- Para revertirlo basta con no usar las tablas: ningún código depende de ellas y `salas_catalogo` solo ha ganado columnas con valor por defecto o nulas.

## Actualización: alineada con los estilos de festivales

La primera versión llamaba `world` a lo que el directorio de festivales ya llamaba `mundo` y no tenía `antigua`,
`experimental` ni `emergente`, que los 525 festivales cargados sí usan. `20261121_catalogo_generos_estilos_festival.sql`
los añade y sustituye `world` por `mundo` (ninguna sala tenía géneros asignados, así que no se pierde nada).
`emergente` no es un género sino el tipo de cartel, pero el directorio lo usa como estilo y la taxonomía lo acepta por
compatibilidad. `server/migrations/__tests__/catalogoGenerosFestival.test.ts` falla si un estilo de `EstiloFestival`
no existe en `catalogo_generos`.
