# ADR: Modularización de SetlistPerformanceView.tsx con controlador, contexto y vistas

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0033](./0033-modularizacion-google-places-explorer.md)

## Problema
`src/components/SetlistPerformanceView.tsx` (visor de repertorio en directo / ensayo) tenía 1857 líneas: estado de interfaz, batería y conexión, navegación entre temas y bloques, transposición y vista de cifrado, teleprompter, pasar página (teclado, pedal y swipe), lanzamiento de práctica y estudio, dos `return` tempranos (repertorio vacío y modo descanso) y ~850 líneas de JSX, más tres subcomponentes de página en el mismo archivo.

## Decisión
Se mantiene el contrato público (`SetlistPerformanceView`, mismas props, usado por ensayos, calendario y repertorio) y se extrae a `src/components/setlist_performance/`:

- **Modelo** `performanceModel.ts`: constantes de swipe y tamaños de letra, metadatos de bloque y `itemLabel`.
- **Hooks por subdominio:** `usePerformanceChrome`, `useDeviceStatus`, `useSetlistNavigation`, `usePracticeLaunch`, `useChordSheet`, `useTeleprompter`, `usePageTurning` y el controlador `useSetlistPerformanceController`.
- **Contexto** `SetlistPerformanceContext` + `SetlistPerformanceProvider` (`valor = ReturnType<controlador> & props`), con `useActivePerformanceItem` para las vistas que solo existen con un elemento actual.
- **Raíz de vistas** `SetlistPerformanceRoot`: elige entre `PerformanceEmptyState`, `PerformanceRestScreen` y `SetlistPerformanceStage` (los dos `return` tempranos salen del cuerpo del componente, de modo que los hooks siempre se ejecutan en el mismo orden).
- **Pantalla:** `PerformanceTopBar`, `PerformanceMoreMenu`, `PerformanceRehearsalBar`, `PerformanceBanners`, `PerformancePage`, `PerformanceFooter`, `PerformancePracticePanel`, `PerformanceSongDrawer` y las páginas `TeleprompterBlockPage`, `ScannedSheetPage`, `ChordSheetPage`.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `SetlistPerformanceView.tsx` | 1857 | ~30 |
| Archivo más grande creado | — | 388 (`ChordSheetPage`) |
| `any` / `@ts-ignore` en los archivos creados | 3 | 0 |

## Cambios deliberados
- La Battery Status API se tipa con un subconjunto propio (`BatteryManagerLike`) en vez de `any`.
- `allItems` pasa a `useMemo` sobre `setlist.items`, lo que además estabiliza las dependencias de los `useMemo` derivados.
- El reinicio del estado transitorio al cambiar de tema mantiene `eslint-disable` justificados (`set-state-in-effect`, `exhaustive-deps`: los setters son estables).
- `blockMeta` pasa a calcularse antes de resolver el repertorio vacío, protegido con `currentItem ?`.

## Consecuencias
Tests de contrato en `setlist_performance/__tests__/`: contenedor <400 líneas, hooks y vistas bien formados y <400 líneas, el contexto falla fuera del proveedor, el modelo resuelve etiquetas y no hay `any`, HTML crudo ni persistencia en storage.
