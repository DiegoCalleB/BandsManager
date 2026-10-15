# ADR: Modularización de SongTransitionPreviewModal y fin de las violaciones de rules-of-hooks

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0040](./0040-modularizacion-atril.md)

## Problema
`src/components/repertorio/SongTransitionPreviewModal.tsx` (escuchar y diagnosticar la unión entre dos temas del setlist) tenía 1596 líneas y concentraba las **43 violaciones de `react-hooks/rules-of-hooks`** del repo: `if (!isOpen || !songA || !songB) return null;` iba antes de ~44 hooks. Si el modal llegaba a renderizarse cerrado y luego abierto con la misma instancia, React cambiaba el número de hooks entre renders y fallaba. CI toleraba esas 43 con un baseline.

## Decisión
Se mantiene el contrato público (`SongTransitionPreviewModal` con las mismas props) y se extrae a `src/components/repertorio/song_transition/`:

- **Guarda separada del cuerpo:** el componente exportado solo decide si se pinta y no llama a ningún hook; el cuerpo `SongTransitionPreview` se monta únicamente con los dos temas presentes. Así el orden de hooks es fijo y la detección de audio no arranca con el modal cerrado.
- **Hooks por dominio:** `useTransitionSources` (maqueta, muestra o archivo local por pista), `useTransitionCues` (Auto-CUE por pista con `useCuesDePista`, CUE guardados y guardado), `useTransitionPlayback` (dos `<audio>` sincronizados por la línea de tiempo o síntesis) y el controlador `useSongTransitionController`.
- **Contexto** `SongTransitionContext` + `SongTransitionProvider`.
- **Vistas:** `SongTransitionView`, `TransitionHeader`, `TransitionTrackCard` (una sola tarjeta para A y B; antes eran dos bloques de ~170 líneas casi iguales), `TransitionPlayer`, `TransitionDiagnosisPanel` y `TransitionFooter`.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `SongTransitionPreviewModal.tsx` | 1596 | 58 |
| Violaciones de `rules-of-hooks` en el repo | 43 | 0 (CI: `HOOKS_BASELINE=0`) |
| Hallazgos de ESLint en el módulo | 56 | 0 |

## Cambios deliberados
- La detección de CUE va por pista: cambiar el audio de una ya no vuelve a analizar la otra.
- Los CUE guardados del tema se aplican desde el primer render (antes esperaban a resolver las URLs de audio).
- Los efectos de reproducción llaman a la última versión de las acciones a través de un ref (`latest`), en vez de cerrar sobre la de un render anterior.
- El rechazo de `audio.play()` (autoplay bloqueado sin gesto) queda documentado: la pista se queda en pausa visible.

## Verificación en navegador
Repertorios → «Probar unión»: autoplay, sinte/audio real, Auto-CUE, estilos y segundos de fundido, pestañas, navegación entre transiciones, cerrar, reabrir y Escape, sin errores de consola.

## Consecuencias
Tests de contrato en `song_transition/__tests__/`: contenedor <400 líneas y sin hooks en la guarda, nada renderizado cerrado o sin tema, módulos <400 líneas, el contexto falla fuera del proveedor, helpers puros (`formatSec`, `cuesGuardados`) y sin `any`, HTML crudo ni persistencia en el navegador.
