# ADR 0046: Directorio público de salas de conciertos de España

- **Estado:** Aceptada
- **Fecha:** 2026-10-19
- **Origen:** nueva

## Contexto

Queremos un directorio público de salas por comunidad, ciudad y estilo, que atraiga búsquedas de bandas que buscan dónde tocar. El catálogo compartido de salas (ADR 0044) ya existe, pero hoy tiene unas 160 salas, ninguna verificada, con la región escrita a mano en los leads («Madrid», «Comunidad de Madrid», «Galicia (A Coruña)», incluso «Lisboa»), y contiene el email y el teléfono de cada sala. Publicar eso tal cual sería publicar datos sucios y contactos. Además Google penaliza las páginas finas generadas en masa.

## Decisión

- **Misma fuente, otra puerta.** El directorio lee de `salas_catalogo` (no hay una tabla paralela) con una lectura propia (`server/db/salasPublicas.ts`) que **solo pide las columnas públicas**: nunca `email_contacto` ni `telefono`. Los contactos siguen saliendo únicamente dentro de la app, al añadir la sala a la agenda de una banda (ADR 0044).
- **Reglas de publicación** (`server/utils/seo/salas/publicas.ts`): solo salas (no festivales ni medios), no marcadas «no contactar», no cerradas permanentemente, que se puedan situar en España y con **web oficial https** a la que enlazar. El aforo solo se muestra si la sala está al menos «probable» (hay un «aforo 11» en un pabellón).
- **Geografía normalizada** (`server/utils/geoEspana.ts`): de `region` y `ciudad` a comunidad y provincia, con igualdad exacta (no por subcadena: «San Sebastián de los Reyes» es de Madrid). Lo que no encaja (Lisboa, regiones ilegibles) no entra en las páginas por zona en vez de colocarse a ojo.
- **Calidad antes que volumen.** Las listas solo se indexan y entran en el sitemap con volumen (30 salas el índice, 8 una comunidad, 5 una ciudad); la ficha de una sala va **siempre** con `noindex` (sin contacto ni más datos propios es una página fina) y el valor SEO está en las listas. La portada `/directories` se indexa cuando al menos dos directorios lo son.
- **Procedencia.** `salas_catalogo.fuentes` (migración `20261112_salas_fuentes.sql`) guarda de dónde sale cada dato; el importador de OpenStreetMap añade `osm` solo a las salas a las que aporta algo y las páginas citan «© colaboradores de OpenStreetMap» (ODbL) cuando toca.
- Rutas en inglés en los dos idiomas: `/directories/venues[/comunidad[/ciudad[/sala]]]` y `/en/directories/venues/…`.

## Alternativas descartadas

- **Publicar todo el catálogo.** Más páginas, pero datos sucios, contactos expuestos y riesgo de contenido fino.
- **Tabla pública aparte, copiada del catálogo.** Dos fuentes de verdad que se desincronizan.
- **Geolocalizar con una API externa.** Coste y términos de uso (Google Places no permite almacenar sus fichas); el código postal y los nombres bastan para España.

## Consecuencias

- Con los datos de hoy casi todo sale con `noindex` (es lo esperado): el directorio crece cuando entra más volumen, por ejemplo activando la importación de OpenStreetMap (`CATALOGO_IMPORTAR_OSM=true`, ver ADR 0044).
- Las salas con región ilegible no aparecen por zona; mejorar `geoEspana.ts` o los datos las recupera sin migraciones.
- Para revertirlo basta con quitar las rutas de `/directories/venues` de `paginasSeo.ts`; el catálogo no cambia (la columna `fuentes` es aditiva).
