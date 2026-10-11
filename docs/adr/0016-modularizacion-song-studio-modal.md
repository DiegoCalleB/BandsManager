# ADR: Modularización de SongStudioModal con controlador, contexto y vistas

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0014](./0014-modularizacion-venue-detail-panel.md) y [0015](./0015-modularizacion-repertorio-setlists.md)

## Problema
`src/components/SongStudioModal.tsx` tenía 5500 líneas: un único componente con más de 100 `useState`/`useRef`/`useEffect`, el motor de reproducción multipista, la grabación, el DSP de audio y unas 2500 líneas de JSX. Las vistas necesitaban decenas de valores del mismo estado, así que extraerlas como componentes con props planas producía interfaces de 40 props (se probó con la fila del mezclador).

## Decisión
Extraer sin cambiar el contrato público (`export default`, `getIdeaTracks`, `MOISES_AVAILABLE_STEMS`, `MOISES_PRESETS_CONFIG` y los tipos de Moisés se siguen exportando desde el modal):

- **Lógica → hooks** en `song_studio/hooks/`: `useStudioPlaybackEngine`, `useTrackAudioDsp`, `useTrackMixerActions`, `useTrackOverdub`, `useSongIdeasCrud`, `useIdeaMicRecording`, `useStudioKeyboardShortcuts`, `useStudioMasterGain`, `useResolvedAudioUrls`, `useMoisesStemsPanel`, `useAiTrackGeneration`, `useStudioFullScreen`, `useStudioIdeasView`, `useIdeaDurations`, `useIdeaLoopControls`, `useIdeaPlaybackTracks`.
- **Controlador** `useSongStudioController`: compone todos los hooks y estado en un solo lugar.
- **Contexto** `SongStudioContext` (+ `SongStudioProvider`): el tipo del valor es `ReturnType<typeof useSongStudioController>` más las props del modal, así que nunca se desincroniza. Las vistas leen del contexto lo que usan y solo reciben por props lo propio de cada instancia (`idea`, `tr`, `idx`…).
- **Vistas** en `song_studio/`: `SongStudioLayout`, `SongStudioHeader`, `SongStudioContentBody`, `SongStudioIdeaCard` (cabecera, acciones de pista, transporte, mezclador, fila de pista, grabación en directo, cajón de overdub, votos, comentarios), `SongStudioAddIdeaForm`, `SongStudioDialogs`, `SongStudioIrisSheet`, etc.
- **Utilidades puras**: `trackColors`, `ideaTracks`, `studioConstants`, `moisesStems`, `songAudioSource`, `audioContext`, `silentAudio`.
- El modal queda en ~50 líneas: controlador + proveedor + `SongStudioLayout`.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `SongStudioModal.tsx` | 5500 | 49 |
| Archivo más grande creado en esta extracción | — | 509 (`SongStudioMixerTrackRow`), 502 (`useStudioPlaybackEngine`) |
| `any` en los archivos creados | decenas | 0 |
| Errores ESLint en los archivos creados | no medido | 0 (3 avisos `exhaustive-deps` heredados) |

## Cambios de comportamiento a conocer
- Los modales de atajos de teclado y de confirmación de borrado ya existían como componentes sin usar (duplicados inline en el modal). Ahora se usan los componentes: el botón «Entendido» usa `Button` del sistema de diseño y ambos van envueltos en `ModalPortal`.
- Código muerto eliminado: `IrisPrismBanner`, `IRIS_ENGINE_COST_EUR`, `formatEurEstimate`, `resetIdeaLoopBounds`, `handleToggleStem`, los presets de estilo y la lógica de generación de pista IA de `useAiTrackGeneration` (ver abajo), y estados cuyos setters nunca se llamaban.
- Se sustituyó un `useEffect` que llamaba a `setState` por un ajuste durante el render (`selectedSongBaseUrl`).
- Las pruebas estáticas `songStudioPlegado` e `irisFueraDeIdeas` leen ahora todo el módulo (`src/audit/songStudioSource.ts`) y comparan sin depender de la indentación.

## Defectos preexistentes que no se corrigen aquí
- **«Pista IA» no genera nada.** `SongStudioAiTrackGenModal` recibe `isGeneratingAiTrack={false}` y `handleGenerateAiInstrumentTrack={() => {}}`; el flujo real (formulario, vista previa, `/api/ai-generate-instrument-track`) estaba en el modal pero nada lo conectaba. Se eliminó como código muerto; está en el historial de git (commit anterior a esta refactorización) por si se quiere reconectar.
- **El tutorial del módulo no se muestra.** `useModuleTutorial('song_studio')` abre el estado, pero `ModuleTutorialModal` nunca se renderizaba en este modal.
- **El filtro por sección y el selector de motor de Iris no tienen interfaz**: `activeSectionFilter` siempre vale `'todas'` y el motor siempre `'fal'`.

## Deuda conocida
- Los hooks reciben hasta ~40 parámetros desde el controlador (mismo patrón que Repertorio); agruparlos por subdominio reduciría el acoplamiento.
- `useStudioPlaybackEngine` y `useStudioKeyboardShortcuts` mantienen avisos `react-hooks/exhaustive-deps` heredados; arreglarlos cambia cuándo se reinstalan los listeners y necesita pruebas de interacción.
- Mutaciones imperativas de refs y elementos `<audio>` compartidos entre hooks llevan un `eslint-disable react-hooks/immutability` con motivo.
- Los modales preexistentes `SongStudioAiComposerModal`, `SongStudioAiMusicModal`, `SongStudioStructureUploadModal` y `SongStudioAiTrackGenModal` conservan sus errores ESLint antiguos.
- La interfaz no se ha probado en un navegador; la verificación es tsc, ESLint y la suite de pruebas.
