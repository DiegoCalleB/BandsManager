# ADR: Modularización de ReelsMetricsView con hooks por subdominio, contexto y vistas

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0021](./0021-modularizacion-chatbot.md)

## Problema
`src/components/reels/ReelsMetricsView.tsx` tenía 2662 líneas: ~40 `useState`, derivados del histórico (ordenación, fusión por fecha, series, dominios de ejes), conexión de Instagram, escáner de capturas con IA, plan de crecimiento y ~1700 líneas de JSX con cuatro tarjetas de plataforma, gráfico, formulario, tabla y dos modales.

## Decisión
Se mantiene el contrato público (`ReelsMetricsView` con nombre, usado por `FansPanel`) y se extrae a `components/reels/metrics/`:

- **Constantes y tipos:** `metricsPeriods.ts` (periodos, antes recreados en cada render) y `metricsTypes.ts` (insights de Instagram, resultado del escáner, punto de serie).
- **Hooks:** `useMetricsSummary`, `useMetricsChart`, `useGrowthPlan`, `useContentItems`, `useInstagramConnection`, `useScreenshotScan`, `useMetricForm` y el controlador `useReelsMetricsController`.
- **Contexto** `MetricsContext` + `MetricsProvider`.
- **Vistas:** `MetricsLayout`, `PlatformsRadarHeader`, `InstagramCard`, `TikTokCard`, `YouTubeCard`, `SpotifyCard`, `FansCard`, `MetricsChartSection`, `ContentVideosSection`, `MetricFormCard`, `MetricsHistoryTable`, `InstagramConnectionModal`, `ScreenshotScanModal`.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `ReelsMetricsView.tsx` | 2662 | ~55 |
| Archivo más grande creado | — | 328 (`InstagramConnectionModal`) |
| `any` / `@ts-ignore` en los archivos creados | ~22 | 0 |
| ESLint en los archivos creados | no medido | 0 errores, 1 aviso `exhaustive-deps` heredado |

## Cambios deliberados
- `SocialMetric` (en `types.ts`) declara ahora `fans?: number`, campo que la vista ya calculaba al fusionar el histórico (antes se accedía con `as any`).
- `catch (err: any)` → `catch (err)`; un `eslint-disable-next-line react-hooks/set-state-in-effect` justificado en la consulta inicial de Instagram.

## Defectos preexistentes detectados y NO corregidos
- `useMetricsChart` genera puntos interpolados «sintéticos» cuando hay menos de dos métricas reales para el periodo; el gráfico puede mostrar curvas que no son datos medidos (conviene marcarlas visualmente).
- Se eliminó `oldestMetric`, que se calculaba y no se usaba.
