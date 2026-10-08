# ADR 0009: Licencia AGPL-3.0 con licencia comercial alternativa

- **Estado:** Aceptada
- **Fecha:** no registrada (AGENTS.md y README la marcan como hecha; el commit exacto no se ha buscado)
- **Origen:** retroactiva. Fuentes: `LICENSE` (AGPL-3.0), `COMMERCIAL-LICENSE.md`, `NOTICE`, `PRIVATE-CORE.md`.

## Contexto

El código es público en GitHub. Queremos que cualquiera pueda estudiarlo y alojarlo, pero que un tercero no pueda cerrar una versión modificada y ofrecerla como servicio sin compartir sus cambios.

## Decisión

Código público bajo AGPL-3.0-only. Si una empresa no puede cumplir la AGPL (por ejemplo, integrar en un producto cerrado), se ofrece una licencia comercial alternativa negociada caso a caso.

## Alternativas descartadas

- **MIT / Apache-2.0:** permitiría que un tercero ofrezca un servicio cerrado con el código, sin devolver nada.
- **Código cerrado:** descarta la visibilidad del proyecto, que también es parte del TFM.
- **Licencia «source-available» (BSL, Elastic):** no es software libre según la OSI; se descartó por ser menos clara para el lector del TFM.

## Consecuencias

- Hay que mantener la separación de lo que es público y lo que no (`PRIVATE-CORE.md`).
- La licencia no resuelve la titularidad de los datos de las bandas ni los riesgos legales de AGENTS.md §8.
