# ADR 0048: Renombrar `salas_catalogo` a `catalogo_salas`

- **Estado:** Aceptada
- **Fecha:** 2026-10-19
- **Origen:** nueva

## Contexto

El catálogo compartido de salas (ADR 0044) se creó como `salas_catalogo`, y el catálogo global (ADR 0047) añadió
tablas con el prefijo `catalogo_` (`catalogo_generos`, `catalogo_sala_generos`, `catalogo_staging`,
`catalogo_supresion`…). En la base de datos la tabla principal quedaba separada de las demás al ordenar por nombre.
El ADR 0047 descartó renombrar «con vistas de compatibilidad» porque una vista olvidada rompe una página pública, y
dejó la puerta abierta a un refactor aparte con su cambio de código. Este es ese refactor.

## Decisión

- La migración `20261114_renombrar_salas_catalogo.sql` hace `ALTER TABLE … RENAME` (no copia): las filas, las claves
  ajenas (`leads.sala_id`, `festivales.sala_id`, `catalogo_sala_generos`, `catalogo_staging`…), la RLS, los índices y
  las restricciones se mueven con la tabla. También renombra los índices y las restricciones que llevaban el nombre
  antiguo (`idx_salas_catalogo_nivel` → `idx_catalogo_salas_nivel`, etc.). Es idempotente.
- **Sin vista de compatibilidad.** El código y la migración van en el mismo despliegue y la migración se aplica antes
  de que arranque el servidor, así que no queda nada que use el nombre antiguo; una vista dejaría dos nombres para lo
  mismo, que es justo lo que se quería evitar.
- Las migraciones anteriores **no se editan**: describen el estado de su momento y se ejecutan en orden; las pruebas que
  las repiten para comprobar su idempotencia devuelven un instante el nombre antiguo a la tabla
  (`server/migrations/__tests__/helpers/nombreAntiguoSalas.ts`).
- Los nombres de ficheros y funciones del código (`salasCatalogo.ts`, `puertoCatalogoSupabase`) no cambian: solo el
  nombre de la tabla.

## Alternativas descartadas

- **Dejarlo como estaba.** Cero riesgo, pero la tabla principal queda lejos de las demás al listar el esquema.
- **Renombrar y crear una vista `salas_catalogo`.** Soporta código antiguo, pero ocultaría los sitios que se olvidaron
  y convive mal con `INSERT … ON CONFLICT` desde PostgREST.
- **Renombrar también `festivales*` a `catalogo_festivales*`.** Encaja con el mismo criterio, pero se decidirá aparte.

## Consecuencias

- Durante el despliegue, la instancia anterior puede tener unos segundos de errores en el catálogo (se tolera: la
  sincronización y la importación son periódicas y el directorio público conserva la última lectura buena).
- Las ramas con código que aún diga `salas_catalogo` fallarán al fusionarse con `main`; hay que cambiar el nombre.
- Para revertirlo basta con `ALTER TABLE catalogo_salas RENAME TO salas_catalogo` y desplegar el código anterior.
