# ADR 0001: Registrar decisiones de arquitectura

- **Estado:** Aceptada
- **Fecha:** 2026-10-08
- **Origen:** nueva

## Contexto

Las decisiones de BandManager vivían repartidas en AGENTS.md (reglas para agentes de IA), en el README y en la memoria de quien las tomó. Las reglas de IA no explican por qué se eligió una alternativa, y el README describe el estado, no las decisiones. Sin registro, cualquiera que llegue al proyecto (incluido el tribunal del TFM) tiene que deducir la razón a partir del código.

## Decisión

Cada decisión técnica con alternativas reales tiene un ADR numerado en `docs/adr/`, con su plantilla y su índice.

## Alternativas descartadas

- **Wiki externa (Notion):** no versionada con el código; se desincroniza sin que nadie lo note.
- **Solo comentarios en el código:** no sobreviven a un refactor y no recogen las alternativas descartadas.
- **Reglas dentro de AGENTS.md:** es el sitio para reglas operativas de IA, no para razonar decisiones.

## Consecuencias

- Las decisiones anteriores a este ADR se han reconstruido a partir del código y de AGENTS.md. Están marcadas como «retroactiva»: no son actas de la época en que se tomaron.
- Hay que mantener el índice. `npm run verify:docs` no comprueba que cada decisión tenga ADR; eso sigue siendo disciplina.
