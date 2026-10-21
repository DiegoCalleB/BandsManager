# ADR 0044: Compartir entre bandas un catálogo de salas sin compartir nada privado

> **Nota (ADR 0048):** la tabla `salas_catalogo` se llama ahora `catalogo_salas`. El texto conserva el nombre de su momento.

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

## Actualización: importación de salas de España desde OpenStreetMap

Para ampliar el catálogo más allá de las salas que ya tienen las bandas, `importarSalasDeOsm` descarga de Overpass los
recintos de música en directo de España (`music_venue`, `concert_hall`, `nightclub` y bares con `live_music=yes`). Se usa
OpenStreetMap (ODbL) y no Google Places porque Google no permite guardar sus fichas de forma masiva. Es opt-in
(`CATALOGO_IMPORTAR_OSM=true`) y solo añade: las salas nuevas entran como «sin verificar», a las existentes solo se les
rellenan los campos vacíos y nunca se toca una verificada. Aplica las mismas reglas de privacidad (email de rol, teléfono fijo,
Instagram que se parezca a la sala). La región sale del código postal. **Atribución obligatoria por la ODbL: «© colaboradores de
OpenStreetMap»** donde se muestren estos datos. Nota: la sincronización desde los leads sigue mandando sobre una sala si
una banda la tiene en su agenda.

## Actualización: importación por comunidad y solo salas de conciertos

Una consulta de Overpass para toda España saturaba los servidores públicos (500 y 502 en los tres). La importación de
OpenStreetMap pide ahora **una consulta por comunidad o ciudad autónoma** (19, con pausa entre ellas), prueba tres
servidores por consulta y, si alguna comunidad falla, importa el resto (es idempotente). Si no llega ninguna, se
reintenta cada hora hasta tres veces. Además se limita a lo que le sirve a una banda: **solo `music_venue` y
`concert_hall`**. Se quitan las discotecas y los bares, pubs, cafés y restaurantes con `live_music=yes`, que metían mucho
ruido. La marca `osm` en `salas_catalogo.fuentes` (ADR 0046) cita a OpenStreetMap donde corresponde.

## Explorar el catálogo: ficha, mapa y festivales

El catálogo se abre desde el botón «Catálogo» de Escenarios (Booking) y desde el menú de herramientas. Tiene dos pestañas, **Salas** y **Festivales**, y las salas se ven en **lista** o en **mapa**; pulsar una sala abre su **ficha** (fiabilidad, completitud de la ficha, dirección, web, redes, mapa pequeño y la fuente que hay que citar).

- **Coordenadas.** `catalogo_salas.lat/lon` salen solo de OpenStreetMap (ODbL): el punto de la importación de OSM y, para el resto, el geocodificador Nominatim (`geolocalizarSalas`, 80 salas por pasada a 1 consulta/s, `CATALOGO_GEOLOCALIZAR=false` lo apaga). Nunca de Google (sus condiciones no dejan guardar coordenadas). Un resultado solo vale si es un local de la ciudad de la sala y cae en España; si no, se guarda el punto de la ciudad con `coordenadas_aprox` y el mapa lo pinta más tenue y la ficha avisa. Las coordenadas se escriben aparte (`guardarCoordenadas`) y la sincronización diaria nunca las toca, así que no se pisan.
- **Dirección.** La ficha ya enseña la dirección del local: es información pública de un negocio, no un dato personal. El email y el teléfono siguen sin salir hasta añadir la sala.
- **Completitud.** `completitudDeSala` cuenta 10 datos que importan a una banda (ciudad, dirección, web, Instagram, email de rol, teléfono fijo, aforo, género, punto exacto en el mapa, fiabilidad). No es la fiabilidad: una sala puede estar muy completa y no haber respondido nunca a nadie.
- **Festivales.** Se leen del directorio público (`catalogo_festivales`), que no tiene contacto; al añadir uno se crea un lead de tipo `festival` con su web y el enlace de la convocatoria en las notas.
- **Aforo.** Se busca en la web de la sala («aforo 300 personas», «capacidad para 250», «250 personas de aforo»), en la portada, la página de contacto y hasta dos de las páginas donde suelen ponerlo (`/la-sala`, `/ficha-tecnica`, `/rider`…). Solo se anota si todas las menciones coinciden: una web con dos salas distintas no dice cuál importa, y es mejor dejarlo vacío que apostar. Nunca pisa un aforo que ya tengamos (de OSM, de Bandflow o de una banda). El filtro «aforo orientativo» del catálogo enseña las salas de la mitad a una vez y media el valor y deja fuera las que aún no tienen dato.

## Wikidata como fuente

Salas de conciertos (clases Q8719053 y Q1060829) y festivales de música (Q868557) de España desde el servicio SPARQL de Wikidata, que es CC0: se puede guardar y mostrar sin condiciones. Se recogen nombre, ciudad, comunidad autónoma, web, aforo y punto en el mapa; nunca contactos. Los elementos con fecha de disolución, de cierre o de fin no entran, ni los recintos de estadio. La importación es común a cualquier fuente externa (`importarDeFuente`): solo añade, rellena huecos, no toca las verificadas, respeta los alias y anota `wikidata` en `fuentes`. Se lanza una vez por arranque. `CATALOGO_IMPORTAR_WIKIDATA` sin definir solo simula (el log dice cuántas traería y algunos nombres), `true` escribe y `false` la apaga.

## Bares con música en directo y salas que faltan

La importación de OSM incluye también `bar`, `pub` y `cafe` **solo si llevan `live_music=yes`** (los bares sin esa etiqueta y los restaurantes siguen fuera) y los guarda con tipo `bar`: donde tocan muchas bandas pequeñas. El filtro «Tipo» del catálogo los ofrece como «Bares con directo». En el catálogo, un botón «¿Falta una sala o un festival? Añádelo» abre «Añadir escenario»; lo que añade la banda entra al catálogo en la siguiente sincronización y se verifica y completa solo (Maps, su web, aforo).
