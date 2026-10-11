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
| [0014](./0014-modularizacion-venue-detail-panel.md) | Modularización de VenueDetailPanel (5607 → ~440 líneas) | Aceptada | nueva |
| [0015](./0015-modularizacion-repertorio-setlists.md) | Modularización de RepertorioSetlists (3403 → ~280 líneas) | Aceptada | nueva |
| [0016](./0016-modularizacion-song-studio-modal.md) | Modularización de SongStudioModal (5500 → ~50 líneas) con controlador, contexto y vistas | Aceptada | nueva |
| [0017](./0017-modularizacion-live-concert-to-album-modal.md) | Modularización de LiveConcertToAlbumModal (3432 → ~50 líneas) con hooks por subdominio, contexto y vistas | Aceptada | nueva |
| [0018](./0018-modularizacion-reels-center.md) | Modularización de ReelsCenter (4155 → ~70 líneas) con hooks por subdominio, contexto y vistas | Aceptada | nueva |
| [0019](./0019-modularizacion-calendar-view.md) | Modularización de CalendarView (3423 → ~70 líneas) con hooks por subdominio, contexto y vistas | Aceptada | nueva |
| [0020](./0020-modularizacion-agent-autonomy-settings-modal.md) | Modularización de AgentAutonomySettingsModal (2786 → ~60 líneas) con hooks, contexto y pestañas | Aceptada | nueva |
| [0021](./0021-modularizacion-chatbot.md) | Modularización de Chatbot (2675 → ~40 líneas) con hooks por subdominio, contexto y vistas | Aceptada | nueva |
| [0022](./0022-modularizacion-reels-metrics-view.md) | Modularización de ReelsMetricsView (2662 → ~70 líneas) con hooks por subdominio, contexto y vistas | Aceptada | nueva |
| [0023](./0023-modularizacion-pdf-export-modal.md) | Modularización de PdfExportModal (2638 → ~60 líneas) con constructor de documento, hooks y vistas | Aceptada | nueva |
| [0024](./0024-modularizacion-booking-crm.md) | Modularización de BookingCRM (2607 → ~75 líneas) con hooks por subdominio, contexto y vistas | Aceptada | nueva |
| [0025](./0025-modularizacion-band-crm.md) | Modularización de BandCRM (2216 → ~40 líneas) con hooks por subdominio, contexto y vistas | Aceptada | nueva |
| [0026](./0026-modularizacion-calendar-event-detail-modal.md) | Modularización de CalendarEventDetailModal (2142 → ~100 líneas) con controlador, contexto y vistas por pestaña | Aceptada | nueva |
| [0027](./0027-ninguna-banda-privilegiada.md) | Ninguna banda es especial en el código (claves `bandmanager_*`, sin banda por defecto, `band-demo`, script de migración de ids) | Aceptada | nueva |
| [0028](./0028-modularizacion-fans-landing.md) | Modularización de FansLanding (2106 → ~50 líneas) con hooks por subdominio, contexto y vistas | Aceptada | nueva |
| [0029](./0029-modularizacion-fans-panel.md) | Modularización de FansPanel (2051 → ~70 líneas) con hooks por subdominio, contexto y vistas | Aceptada | nueva |
| [0030](./0030-modularizacion-band-switcher-modal.md) | Modularización de BandSwitcherModal (1937 → ~40 líneas) con hooks por subdominio, contexto y vistas | Aceptada | nueva |
| [0031](./0031-modularizacion-app.md) | Modularización de App.tsx (2814 → 24 líneas) con controlador, contexto, puerta de entrada y armazón | Aceptada | nueva |
| [0032](./0032-modularizacion-tour-manager.md) | Modularización de TourManager.tsx (1918 → 71 líneas) con controlador, contexto y vistas | Aceptada | nueva |
| [0033](./0033-modularizacion-google-places-explorer.md) | Modularización de GooglePlacesExplorerModal.tsx (1872 → ~40 líneas) con controlador, contexto y vistas | Aceptada | nueva |
| [0034](./0034-modularizacion-setlist-performance-view.md) | Modularización de SetlistPerformanceView.tsx (1857 → ~30 líneas) con controlador, contexto y vistas | Aceptada | nueva |
| [0035](./0035-quitar-bandas-del-proyecto-de-ejemplo.md) | Quitar del código las bandas del antiguo proyecto de ejemplo (seed, cuenta privilegiada) | Aceptada | nueva |
| [0036](./0036-modularizacion-leads-table.md) | Modularización de LeadsTable.tsx (1847 → ~90 líneas) con controlador, contexto y vistas | Aceptada | nueva |
| [0037](./0037-modularizacion-calendar-sidebar-logistics.md) | Modularización de CalendarSidebarLogistics (1769 líneas, ~120 props) en vistas por pestaña que leen el contexto | Aceptada | nueva |
| [0038](./0038-modularizacion-onboarding-wizard.md) | Modularización de OnboardingWizardModal.tsx (1736 → 52 líneas): un hook por paso, controlador, contexto y vistas | Aceptada | nueva |
| [0039](./0039-modularizacion-user-profile-modal.md) | Modularización de UserProfileModal.tsx (1721 → 57 líneas): hooks, contexto y vistas por sección | Aceptada | nueva |

## Cómo añadir uno

1. Copia `0000-plantilla.md` a `NNNN-titulo-en-kebab-case.md` con el siguiente número.
2. Rellena contexto, decisión, **alternativas descartadas** y consecuencias.
3. Añade la fila al índice.
4. Si sustituye a otro, cambia el estado del anterior a «Sustituida por».

**Sobre los ADR retroactivos.** Se han reconstruido a partir del código y de AGENTS.md. El contexto, la decisión y las consecuencias se pueden comprobar en el código; las *alternativas descartadas* son las que razonablemente se podían haber elegido, y el repositorio no documenta que se evaluaran en su día.

Un ADR no se reescribe cuando cambia la decisión: se crea uno nuevo que sustituye al anterior.
