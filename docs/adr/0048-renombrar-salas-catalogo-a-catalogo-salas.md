# ADR 0048: Renombrar `salas_catalogo` y las tablas de festivales bajo el prefijo `catalogo_`

- **Estado:** Aceptada
- **Fecha:** 2026-10-19
- **Origen:** nueva

## Contexto

El catálogo compartido de salas (ADR 0044) se creó como `salas_catalogo`, el directorio de festivales (ADR 0045) como
`festivales`, `festival_ediciones` y `festival_convocatorias`, y el catálogo global (ADR 0047) añadió tablas con el
prefijo `catalogo_` (`catalogo_generos`, `catalogo_sala_generos`, `catalogo_staging`,
`catalogo_supresion`…). En la base de datos la tabla principal quedaba separada de las demás al ordenar por nombre.
El ADR 0047 descartó renombrar «con vistas de compatibilidad» porque una vista olvidada rompe una página pública, y
dejó la puerta abierta a un refactor aparte con su cambio de código. Este es ese refactor.

## Decisión

- La migración `20261114_renombrar_salas_catalogo.sql` hace `ALTER TABLE … RENAME` (no copia) de cuatro tablas:
  `salas_catalogo` → `catalogo_salas`, `festivales` → `catalogo_festivales`, `festival_ediciones` →
  `catalogo_festival_ediciones` y `festival_convocatorias` → `catalogo_festival_convocatorias`. Las filas, las claves
  ajenas (`leads.sala_id`, `catalogo_festivales.sala_id`, `festival_id`, `catalogo_sala_generos`, `catalogo_staging`…),
  la RLS, los índices y las restricciones se mueven con la tabla. También renombra los índices y las restricciones que
  llevaban el nombre antiguo (`idx_salas_catalogo_nivel` → `idx_catalogo_salas_nivel`, `festivales_pkey` →
  `catalogo_festivales_pkey`…). Es idempotente.
- **Sin vista de compatibilidad.** El código y la migración van en el mismo despliegue y la migración se aplica antes
  de que arranque el servidor, así que no queda nada que use el nombre antiguo; una vista dejaría dos nombres para lo
  mismo, que es justo lo que se quería evitar.
- Las migraciones anteriores **no se editan**: describen el estado de su momento y se ejecutan en orden; las pruebas que
  las repiten para comprobar su idempotencia devuelven un instante el nombre antiguo a la tabla
  (`server/migrations/__tests__/helpers/nombreAntiguoSalas.ts`).
- Los nombres de ficheros y funciones del código (`salasCatalogo.ts`, `festivales.ts`, `puertoCatalogoSupabase`) no
  cambian, ni las columnas, las rutas públicas (`/directories/festivals`) ni el script `npm run festivales:cargar`: solo
  el nombre de las tablas.

## Alternativas descartadas

- **Dejarlo como estaba.** Cero riesgo, pero la tabla principal queda lejos de las demás al listar el esquema.
- **Renombrar y crear una vista `salas_catalogo`.** Soporta código antiguo, pero ocultaría los sitios que se olvidaron
  y convive mal con `INSERT … ON CONFLICT` desde PostgREST.

## Consecuencias

- Durante el despliegue, la instancia anterior puede tener unos segundos de errores en el catálogo (se tolera: la
  sincronización y la importación son periódicas y el directorio público conserva la última lectura buena).
- Las ramas con código que aún diga `salas_catalogo` fallarán al fusionarse con `main`; hay que cambiar el nombre.
- Para revertirlo basta con renombrar las tablas de vuelta (`ALTER TABLE catalogo_salas RENAME TO salas_catalogo`, etc.) y desplegar el código anterior.
