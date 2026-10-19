# ADR 0045: Directorio público de festivales curado, sin edición abierta

- **Estado:** Aceptada
- **Fecha:** 2026-10-19
- **Origen:** nueva

## Contexto

Queremos un directorio público de festivales (y más adelante salas) con convocatorias y plazos, que atraiga búsquedas y que se mantenga al día. La tentación es dejar que cualquiera añada y corrija fichas, como en Maneras de Vivir, pero un dato público erróneo (un plazo equivocado, una sala cerrada) cuesta credibilidad y puede hacer perder una convocatoria a una banda. Además Google penaliza las páginas finas generadas en masa.

## Decisión

- **Datos curados en el repositorio** (`server/utils/seo/festivales/datos.ts`). Una ficha entra por pull request, con su `fuente` (https) y `verificadoEn`. Nadie edita lo publicado desde fuera.
- **Nada se inventa.** Si un campo no se pudo comprobar (web oficial, plazo de cierre) se omite; una convocatoria sin plazo conocido no se anuncia como abierta.
- **Caducidad automática.** Una ficha sin comprobar en 365 días desaparece del índice, devuelve 404 y sale del sitemap (`server/utils/seo/festivales/vigencia.ts`).
- **Calidad antes que volumen.** Una ficha *mínima* (solo lugar y estilo, sin web oficial ni convocatoria) se lista pero se sirve con `noindex`. El directorio solo se indexa y entra en el sitemap con al menos 8 fichas *completas* vigentes.
- **Sin datos personales.** Solo datos del evento y su web oficial; nada de contactos de personas.
- Páginas bajo `/directories` (portada de los directorios; las guías con consejos siguen en `/guias`): `/directories/festivals`, `/directories/festivals/:slug` y, en inglés, `/en/directories/…`. Los tramos de la URL van en inglés en los dos idiomas. Las rutas anteriores (`/festivales`, `/listados`, `/en/festivals`) redirigen (301); el texto sale de datos estructurados, así que ambos idiomas se mantienen a la vez.

## Alternativas descartadas

- **Edición abierta (wiki).** Más cobertura, pero admite vandalismo y errores sin responsable.
- **Base de datos con panel de edición desde el principio.** Útil con volumen; ahora es infraestructura sin datos.
- **Scraping de buscadores o Google Places.** Los términos de uso lo impiden y los datos no son fiables.

## Consecuencias

- La calidad depende de quien revise cada ficha; el coste es manual y por eso es pequeño al principio.
- Cuando haya volumen, el siguiente paso es una cola de **sugerencias** (tabla privada con RLS, límite de envíos, moderación y registro de cambios) que un revisor aprueba; la ficha publicada no se modifica hasta entonces. Las salas seguirán la misma regla y no usarán el catálogo privado de las bandas (ADR 0044).
- Para revertirlo basta con quitar las cuatro rutas de `paginasSeo.ts` y las entradas del sitemap.
