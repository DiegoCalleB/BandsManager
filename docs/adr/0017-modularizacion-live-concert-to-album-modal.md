# ADR: Modularización de LiveConcertToAlbumModal con hooks por subdominio, contexto y vistas

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0016](./0016-modularizacion-song-studio-modal.md)

## Problema
`src/components/repertorio/LiveConcertToAlbumModal.tsx` tenía 3432 líneas: un componente con ~45 `useState`, ~30 handlers (subida binaria, análisis IA, edición de cortes, transcripción, generación del disco) y ~2100 líneas de JSX, de las que la fila de cada corte sola ocupaba ~880.

## Decisión
Se mantiene el contrato público (`LiveConcertToAlbumModal` y el tipo `TrackCutItem` se siguen exportando desde el modal; `DiscografiaView` no cambia) y se extrae a `repertorio/live_concert_album/`:

- **Tipos y utilidades puras:** `types.ts` (`TrackCutItem`, respuestas de la API, `ConcertSetlistDraft`) y `timeFormat.ts`.
- **Hooks por subdominio** (`hooks/`): `useTrackHistory` (cortes + deshacer/rehacer), `useYoutubeCookies`, `useConcertSourceMedia` (YouTube/archivo local/demo, subida por trozos), `useSnippetScrubber`, `useTrackEditing`, `useSnippetPreview`, `useConcertAnalysis`, `useConcertTranscription`, `useAlbumGeneration`.
- **Controlador** `useLiveConcertAlbumController` que los compone; **contexto** `LiveConcertAlbumContext` + `Provider` con tipo `ReturnType<controlador> & props del modal`, que no puede desincronizarse.
- **Vistas:** `LiveConcertAlbumLayout`, `ModalHeader`, `ConcertErrorBanner`, `IngestStep`, `TracksEditorStep` (+ `AudioAvailabilityBanner`, `LinkedSourceNotice`, `EditorToolbar`, `FirstTrackHint`, `ConcertTimeline`, `TranscribeAllProgress`, `GenerateAlbumButton`), `TrackRow` (+ `TrackHeaderRow`, `TrackTitleRow`, `TrackChordsPanel`, `TrackSpeechPanel`, `TrackSnippetPlayer`), `GeneratedAlbumResult`, `YoutubeCookiesDialog`, `QuickNamingDialog`.
- Antes de extraer los hooks se reordenaron las sentencias del componente por subdominio con el compilador de TypeScript, para que cada grupo fuese contiguo y sin dependencias cíclicas.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `LiveConcertToAlbumModal.tsx` | 3432 | ~50 |
| Archivo más grande creado | — | 379 (`QuickNamingDialog`) |
| `any` / `@ts-ignore` en los archivos creados | 9 `catch (err: any)` y 7 `apiFetch<any>` | 0 (respuestas tipadas, `getErrorMessage`) |
| ESLint en los archivos creados | no medido | 0 errores, 0 avisos |

Los tests viven en `live_concert_album/__tests__/` (formato de tiempo, contratos de módulos, estado inicial del historial y reglas estáticas: sin `dangerouslySetInnerHTML`, sin `any`, sin `localStorage.setItem`).

## Comportamiento modificado deliberadamente
- Los `useEffect` de teclado (deshacer/rehacer) y de cookies se reescribieron: el primero con `useCallback` y dependencias completas; el segundo con bandera de cancelación en lugar de llamar a una función que hace `setState` dentro del efecto.

## Defectos preexistentes detectados y NO corregidos
- `playingTrackUrl` nunca se actualiza (`setPlayingTrackUrl` no se usaba): el indicador «reproduciendo» de la fila no llega a activarse.
- `uploadFileBinary` lee `bandmanager_user` de `localStorage` para enviar `x-band-id`; el servidor debe seguir resolviendo la banda con `getTargetBandId` e ignorar esa cabecera (AGENTS.md §2.1).
- Se envía `tipoFormato: "directo"`, valor que no existe en la unión `Setlist["tipoFormato"]`; `ConcertSetlistDraft` lo modela como `string` para no cambiar el payload.
- `DiscografiaView` aún tipa `prev: any[]` al recibir el setlist.

## Alternativas descartadas
- **Props planas por vista:** la fila del corte necesitaba ~38 valores del mismo estado.
- **Un único hook gigante:** solo desplazaba las 1200 líneas de lógica a otro archivo.
