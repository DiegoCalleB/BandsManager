# ADR: Modularización de ReelsCenter con hooks por subdominio, contexto y vistas

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0017](./0017-modularizacion-live-concert-to-album-modal.md)

## Problema
`src/components/ReelsCenter.tsx` tenía 4155 líneas: ~110 `useState`, ~35 handlers (análisis IA de vídeo, corte físico, copy por red, programación, publicación, métricas) y ~2100 líneas de JSX, con el editor del clip seleccionado en solitario por encima de 680.

## Decisión
Se mantiene el contrato público (`export default ReelsCenter` y los tipos `ReelCard`, `HighlightClip`, `OptimalTime`, `YoutubeVideoMeta`) y se extrae a `components/reels_center/`:

- **Helpers y constantes puras:** `reelsHelpers.ts` (rangos, `formatTime`, copy por red, clave de archivo), `reelsConstants.ts`, `reelsApiTypes.ts` (respuestas tipadas de la API).
- **Hooks por subdominio** (`hooks/`): `useBandToneAnalysis`, `useReelsSync`, `useVideoSource`, `useRenderedClipState`, `useCopyDraftState`, `useClipFeedbackState`, `useSocialPublishing`, `useAnalysisTimeline`, `useVideoFileInput`, `useVideoAnalyzer`, `useHighlightEditing`, `useReelStyleOptions`, `useCopyActions`, `useClipRendering`, `useClipReanalysis`.
- **Controlador** `useReelsCenterController`, **contexto** `ReelsCenterContext` + `Provider` (tipo derivado del retorno del controlador).
- **Vistas:** `ReelsCenterLayout`, `ReelsCenterHeader`, `SyncNotices`, `PipelineTab` (`KanbanBoard`, `SoulWriterCard`), `AnalyzerTab` (`VideoUploadCard` con selector, entrada, opciones y estados del análisis; `HighlightsLighttable`; `PostSchedulerEditor` con resumen, reanálisis, Growth Studio, editor de copy, selector de red, programación, publicación automática y acciones; `PublicationsCalendar`), `ReelsPhonePreviewPanel`, `ConnectAccountDialog`.
- Los estados que otros flujos reinician (clip renderizado, borrador de copy, feedback) viven en hooks de estado previos para evitar dependencias cíclicas; el reordenado se hizo con el compilador de TypeScript.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `ReelsCenter.tsx` | 4155 | ~55 |
| Archivo más grande creado | — | 351 (`useAnalysisTimeline`) |
| `any` / `@ts-ignore` en archivos creados | ~25 | 0 |
| ESLint en archivos creados | no medido | 0 errores, 0 avisos |

## Código muerto eliminado (recuperable desde git)
Se verificó con el compilador que no lo usaba ninguna vista:
- Formulario y handlers de métricas manuales (`handleSaveMetric`, `handleScanRealMetrics`… ~160 líneas): la vista real es `reels/ReelsMetricsView`. Por eso `App.tsx` ya no pasa `metrics`/`onAddMetric`/`onUpdateMetric`/`onDeleteMetric` a `ReelsCenter`.
- Arsenal de ganchos virales (`VIRAL_HOOK_PRESETS`, `handleSelectHookPreset`, `showHookArsenal`), `moveReel`, `textMuted` y el flag `isWhisperTranscribed` (se escribía pero nunca se leía).

## Cambios deliberados
- `cropMode` admite `'smart_pan'` en el tipo de estado y de `ReelsTheaterModal` (antes se forzaba con `as any`).
- Dos `useEffect` mantienen un `eslint-disable-next-line react-hooks/set-state-in-effect` justificado (limpieza de la ficha de vídeo y reinicio de la simulación al cambiar de clip).

## Pendiente conocido
- Los hooks de análisis y renderizado reciben muchos setters (hasta ~40) porque reinician el mismo grupo de estados; agruparlos en un `resetClipState()` es el siguiente paso.
