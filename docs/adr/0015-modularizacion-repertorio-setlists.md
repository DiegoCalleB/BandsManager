# ADR: Modularización de RepertorioSetlists por Strangler Fig asistido por AST

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0014](./0014-modularizacion-venue-detail-panel.md)

## Problema
`src/components/RepertorioSetlists.tsx` tenía 3403 líneas: unas 2700 de estado, efectos y handlers (más de 75 `useState`) y unas 420 de JSX.

## Decisión
Extraer sin cambiar el contrato público del componente, usando el compilador de TypeScript para calcular dependencias y tipos de cada bloque:
- **Lógica → hooks** en `repertorio/hooks/`: `useBandRepertoireScope` (aislamiento de plantillas por banda), `useRepertorioPlayers`, `useRepertorioData`, `useRepertorioPersistence`, `useActiveSetlistState`, `useRepertorioViewState`, `useEnergyMapData`, `useRepertorioPlaybackAndModals`, `useRepertorioDialogs`, `useSetlistItemPopovers`, `useSetlistSync`, `useSetlistCrud`, `useSetlistDeletion`, `useSetlistItemActions`, `useSetlistItemsMutations`, `useSetlistReordering`, `useCatalogActions`, `useSongEditing`.
- **JSX → vistas** `RepertorioSetlistsView` y `RepertorioCatalogView`.
- Navegación de pestañas en `src/hooks/useRepertorioTabs.ts` (función pura `resolveRepertorioTab` testeada).
- Tipos: `AddableItemKind`, `Analysis` exportado, `getErrorMessage` en lugar de `catch (err: any)`.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `RepertorioSetlists.tsx` | 3403 | 276 |
| Archivo más grande creado en esta extracción | — | 421 (`RepertorioSetlistsView` y los hooks quedan por debajo) |
| `any` en el contenedor, hooks y vistas | decenas | 0 |
| Errores ESLint en esos archivos | no medido | 0 |
| Suite completa | verde | verde (281 archivos, 2451 tests) |

## Cambios de comportamiento a conocer
- Se eliminó código muerto: los handlers de grabación y subida de audio para items de show (`handleStartRecordingShowItem`, `handleStopRecordingShowItem`, `handleShowItemAudioFileUpload`) y sus estados/refs no se usaban en ningún sitio.
- Dos tests estáticos que leían el código fuente del contenedor ahora leen también `repertorio/hooks/` y `CatalogoGeneralView.tsx`, donde vive ahora ese código.

## Deuda conocida
- Otros archivos de `repertorio/` ya eran grandes antes de esta extracción y siguen sin tocar: `LiveConcertToAlbumModal.tsx` (~3400 líneas) y `PdfExportModal.tsx` (~2600). Son los siguientes candidatos.
- Los hooks reciben muchos parámetros (hasta ~30): son las dependencias reales que antes eran variables del cierre. Un contexto del módulo reduciría esa superficie.
- No se ha probado en navegador; los tests cubren contratos, render y tamaño, no interacción.
