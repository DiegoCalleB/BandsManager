# Registro de decisiones de arquitectura (ADR)

Cada decisión técnica relevante tiene un registro: qué se decidió, por qué, y qué se descartó.
Usamos el formato [plantilla](./0000-plantilla.md) (inspirado en MADR).

## Índice

| ADR | Título | Estado | Origen |
|---|---|---|---|
| [0001](./0001-registrar-decisiones-arquitectura.md) | Registrar decisiones de arquitectura | Aceptada | nueva |
| [0002](./0002-monolito-express-spa-react.md) | Monolito Express + SPA React/Vite | Aceptada | retroactiva |
| [0003](./0003-supabase-postgres-rls.md) | Supabase (Postgres) con RLS | Aceptada | retroactiva |
| [0004](./0004-band-id-resuelto-en-servidor.md) | `band_id` resuelto siempre en servidor | Aceptada | retroactiva |
| [0005](./0005-aprobacion-humana-agentes.md) | Aprobación humana antes de cualquier envío de agente | Aceptada | retroactiva |
| [0006](./0006-ia-multiproveedor.md) | IA multi-proveedor con Gemini por defecto y DeepSeek de respaldo | Aceptada | retroactiva |
| [0007](./0007-scheduler-en-proceso.md) | Scheduler de agentes en el mismo proceso | Aceptada | retroactiva |
| [0008](./0008-migraciones-sql-versionadas.md) | Migraciones SQL versionadas en `supabase/migrations/` | Propuesta (pendiente de decisión) | retroactiva + nueva |
| [0009](./0009-licencia-agpl-doble.md) | Licencia AGPL-3.0 con licencia comercial alternativa | Aceptada | retroactiva |
| [0010](./0010-stems-cloud-y-dsp-local.md) | Separación de pistas: modelos en GPU y DSP local | Aceptada | retroactiva |
| [0011](./0011-docs-as-code.md) | Documentación como código, verificada en CI | Aceptada | nueva |
| [0012](./0012-contrato-api-openapi-por-ast.md) | Contrato de API OpenAPI generado por análisis del AST | Aceptada | nueva |
| [0013](./0013-puerta-local-de-calidad.md) | Puerta local de calidad antes de cada push | Aceptada | nueva |

## Cómo añadir uno

1. Copia `0000-plantilla.md` a `NNNN-titulo-en-kebab-case.md` con el siguiente número.
2. Rellena contexto, decisión, **alternativas descartadas** y consecuencias.
3. Añade la fila al índice.
4. Si sustituye a otro, cambia el estado del anterior a «Sustituida por».

**Sobre los ADR retroactivos.** Se han reconstruido a partir del código y de AGENTS.md. El contexto, la decisión y las consecuencias se pueden comprobar en el código; las *alternativas descartadas* son las que razonablemente se podían haber elegido, y el repositorio no documenta que se evaluaran en su día.

Un ADR no se reescribe cuando cambia la decisión: se crea uno nuevo que sustituye al anterior.
