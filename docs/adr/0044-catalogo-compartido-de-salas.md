# ADR 0044: Compartir entre bandas un catálogo de salas sin compartir nada privado

- **Estado:** Aceptada
- **Fecha:** 2026-10-18
- **Origen:** nueva

## Contexto

Cada banda descubre salas por su cuenta (Scout, importaciones, a mano) y esa información es privada de su CRM (`leads`, siempre filtrado por `band_id`, AGENTS.md §2.1). Una banda nueva empieza de cero aunque otras ya hayan encontrado, contactado y verificado cientos de salas. Compartirlo choca con tres cosas: el aislamiento entre bandas (el mandamiento 1), el RGPD (los contactos que las bandas guardan a veces son de personas) y la fiabilidad (un dato copiado de otra banda puede estar mal o desactualizado).

## Decisión

Un catálogo aparte, `salas_catalogo`, con solo datos **públicos de la sala**, calculado por el servidor a partir de los leads de todas las bandas y nunca escrito por una banda directamente (`server/services/catalogoSalas.ts`, reglas puras en `server/utils/salaCatalogo.ts`). El lead sigue siendo de cada banda y solo guarda un enlace opcional (`leads.sala_id`).

- **Qué entra y qué no.** Solo recintos (sala, festival, ayuntamiento, discoteca): ni medios, ni agencias, ni bandas, ni leads de prueba. Nunca notas, pitches, estados ni historial. De cada sala: nombre, ciudad, dirección, aforo, género, web, Instagram, y los contactos **de la sala**: email de rol (`info@`, `booking@`…, nunca de persona ni de dominios personales o de relleno) y teléfono **fijo** español. Un Instagram solo se publica si su usuario se parece al nombre de la sala (podría ser el de una persona).
- **Identidad y deduplicación conservadoras.** Clave `place:<id de Google>` o `nc:<nombre>|<ciudad>` normalizados. Fusionar dos salas distintas es peor que dejar un duplicado, así que la clave no adivina («Capitol» y «Sala Capitol» siguen separadas).
- **Fiabilidad calculada, no declarada.** Puntos por señales (id de Google, web, email de rol, correo entregado sin rebote, respuesta humana) y resta por rebotes; la verificación caduca a los 180 días. Tres niveles: sin verificar, probable, verificada. Las bandas solo ven contadores anónimos («cuántas», nunca «cuáles»).
- **El contacto no sale en la consulta.** La ficha que ve una banda (y el modelo del chat) lleva solo `tiene_email` / `tiene_telefono`; el email y el teléfono se copian al lead de la banda al confirmar «Añadir» (`POST /api/catalogo/salas/:id/anadir`), que respeta su límite de plan y su `band_id` de sesión. Una sala `no_contactar` desaparece para todas las bandas.
- **Se mantiene sola.** Un planificador sincroniza a los 5 minutos de arrancar y cada 24 h (idempotente; solo escribe lo que cambia). La sincronización nunca toca `no_contactar` ni sobrescribe una sala verificada con lo que escriba una banda.
- **Las sugerencias son explicables.** Para una banda nueva se proponen salas por ciudad, zona y género, con el motivo en palabras llanas, sin las que ya tiene.
- **Procedencia de los datos enriquecidos.** Cada campo que rellena el enriquecimiento (Google Maps, web de la sala, buscador, catálogo, IA) se anota con su fuente y confianza en `leads.datos_fuentes`; lo que viene de una IA es de confianza baja. Un email que aporta una IA o un buscador se comprueba por DNS y, si su dominio no existe, **se guarda con un aviso** («Compruébalo antes de escribir») en vez de descartarlo: un fallo de red pasajero no debe hacer perder un email real, y decidir si fiarse es cosa de quien conoce la sala. El aviso va ligado al valor exacto del email, así que desaparece solo al editarlo.

## Alternativas descartadas

- **Compartir los leads directamente (vista sobre `leads`).** Es lo más simple, pero expone notas, estados y contactos de personas y rompe el aislamiento por diseño. Descartada por seguridad.
- **Que cada banda «publique» sus salas al catálogo.** Da el control a la banda, pero el catálogo dependería de que alguien se acuerde, y permitiría envenenarlo (datos falsos o spam). El servidor lo calcula y aplica las reglas por igual.
- **Fusionar duplicados de forma difusa (distancia de edición, quitar «sala», «club»…).** Más cobertura, pero un falso positivo une dos salas distintas y mezcla sus contactos. Los duplicados conocidos están en el banco de evaluación como fallos aceptados.
- **Mostrar el contacto en la consulta.** Más cómodo, pero convierte el catálogo en una lista de correos descargable. Mostrarlo solo al añadir exige una acción consciente y gasta una plaza del plan.
- **Una nota de fiabilidad introducida por los usuarios (votos, «me respondieron»).** Manipulable y subjetiva; las señales objetivas (entrega, respuesta, rebote) ya salen de lo que hacen los agentes.

## Consecuencias

- Una banda nueva arranca con cientos de salas relevantes, ordenadas por fiabilidad, y los leads nuevos de una sala conocida se completan sin gastar APIs.
- La calidad del catálogo es la de los datos de las bandas: el aforo de una ficha puede estar mal (hay un «aforo 11» para un pabellón grande) y de momento no se corrige solo.
- Hay un compromiso de privacidad por cobertura: se descartan Instagram de personas y teléfonos móviles aunque a veces fueran los de la sala.
- La sincronización lee todos los leads de todas las bandas (con el cliente de servicio); es la única pieza que cruza bandas, por eso solo calcula, no expone, y tiene su banco de pruebas de privacidad (`server/evals/catalogoGolden.ts`, que corre en CI).
- Para revertirlo basta con dejar de montar `server/routes/catalogo.ts` y el planificador: los leads no dependen del catálogo (`sala_id` es opcional y `ON DELETE SET NULL`).

## Actualización: verificación en Google Maps

Tras cada sincronización, el servidor comprueba en Google Places unas 40 salas del catálogo (las que más tiempo llevan sin
comprobarse; se repite cada 90 días) y anota `estado_negocio`. Solo es no destructiva: una sala `cerrado_permanente` deja de
salir en consultas, sugerencias y altas, pero no se borra ni se toca la agenda de ninguna banda. Una sala solo se marca como
cerrada si Maps devuelve, con seguridad, la misma (por `place_id` o por nombre); un fallo de red o de cuota no escribe nada.
`CATALOGO_VERIFICAR_MAPS=false` la apaga. Los leads de las bandas no se verifican ni se borran por esta vía.
