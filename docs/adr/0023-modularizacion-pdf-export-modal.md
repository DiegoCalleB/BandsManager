# ADR: Modularización de PdfExportModal con constructor de documento, hooks y vistas

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0022](./0022-modularizacion-reels-metrics-view.md)

## Problema
`src/components/repertorio/PdfExportModal.tsx` tenía 2638 líneas: ~300 de constantes y cálculo de maquetación a nivel de módulo, ~35 estados de ajustes, persistencia en servidor, vista previa paginada y una función `buildPrintDocument` de ~1220 líneas que construía el HTML y el CSS de impresión midiendo filas en un iframe oculto, más ~650 de JSX.

## Decisión
Se mantiene el contrato público (`PdfExportModal` y el tipo `SetlistStylePreset`) y se extrae a `repertorio/pdf_export/`:

- **Maquetación pura** (`printLayout.ts`): márgenes, columnas, tipografías, `computeNoteLayout`, `ensurePrintFonts` y `SetlistStylePreset`.
- **Constructor del documento** (`printDocumentBuilder.ts`): `buildPrintDocument(ctx, opts)` ya no es un cierre del componente sino una función con un contexto explícito de ajustes. De ella salen `buildRowHtmlFactory` (HTML de cada fila), `buildPrintStyles` (CSS de la hoja), `buildHeaderFooter` y `buildPrintScripts`.
- **Hooks:** `usePrintMembers`, `usePrintSettings`, `useMemberSelection`, `useSongMarks`, `usePrintSettingsPersistence`, `usePrintPreview` y el controlador `usePdfExportController`.
- **Contexto** `PdfExportContext` + `PdfExportProvider` y **vistas**: `PdfExportLayout`, `PdfExportHeader`, `PdfControlPanel` (`ModeAndTargetRow`, `AdvancedSettingsToggle`), `SheetPager`, `SheetPreviewPane`, `MemberNotesHost`.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `PdfExportModal.tsx` | 2638 | ~60 |
| Archivo más grande creado | — | 624 (`buildPrintStyles`, plantilla CSS) |
| `any` / `@ts-ignore` en los archivos creados | 5 | 0 |
| ESLint en los archivos creados | no medido | 0 errores, 1 aviso `exhaustive-deps` heredado |

## Cambios deliberados
- El modal de notas recibe un `ThemeColors` completo (`NOTES_MODAL_COLORS`) en lugar de un objeto parcial forzado con `as any`.
- Al mover el cuerpo de `buildPrintDocument` se reindentaron las plantillas HTML/CSS; solo cambia espacio en blanco, no su semántica.

## Defectos preexistentes detectados y NO corregidos
- `buildPrintStyles` es una plantilla CSS de ~590 líneas; podría dividirse por secciones (página, filas, manuscrita) pero no se hizo para no alterar el CSS.
- Los parámetros `membersToExport` que declaran algunos constructores solo se usan como tipo; se sustituyó `typeof membersToExport` por `BandMemberOption`.
- `PdfControlPanel` conserva un borde (`border-[var(--line)]`) en el panel de marcas, contrario a la regla «cero bordes» de `visual-identity`.
