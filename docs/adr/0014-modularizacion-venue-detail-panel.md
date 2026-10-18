# ADR: Modularización de VenueDetailPanel por Strangler Fig asistido por AST

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas, anti God Components)

## Problema
`src/components/booking/VenueDetailPanel.tsx` tenía 5607 líneas: unos 1170 de estado y handlers y unos 4270 de JSX en un único componente.

## Decisión
Extraer sin cambiar contratos públicos (`VenueDetailPanel` mantiene sus props) y con un script basado en el compilador de TypeScript, en lugar de reescribir a mano:
- **JSX → secciones** en `venue_panel/`. Las variables libres de cada bloque pasan a ser props, con el tipo que el type checker infiere en el punto de uso.
- **Estado y handlers → hooks / constructores de acciones** en `venue_panel/hooks/`. Los que van después del `return null` anticipado son funciones planas (`buildVenuePanelActions`) para no violar las reglas de hooks.
- Respuestas de API tipadas en `apiResponses.ts` y `getErrorMessage` sustituye a `catch (err: any)`.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `VenueDetailPanel.tsx` | 5607 | ~440 |
| Archivo más grande del módulo | 5607 | 667 |
| Errores ESLint en el panel | 137 | 3 |
| Usos de `any` en el panel y secciones | ~100 | 0 |
| `tsc --noEmit` | limpio | limpio |

## Deuda conocida
- 3 errores de `react-hooks`: dos efectos que derivan estado de `selectedLead` y un acceso a ref en render. Reescribirlos cambia cuándo se reinicia el formulario de edición, así que requiere pruebas en navegador.
- `buildVenuePanelActions` aún asigna `selectedLead.pitch_generado` directamente.
- Los tests cubren render y contratos, no interacción.
