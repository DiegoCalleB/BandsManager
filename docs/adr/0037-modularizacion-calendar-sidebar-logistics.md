# ADR: Modularización de CalendarSidebarLogistics con contexto y vistas por pestaña

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0036](./0036-modularizacion-leads-table.md) y del patrón de contexto del Calendario

## Problema
`src/components/calendar/CalendarSidebarLogistics.tsx` tenía 1769 líneas. Era una vista puramente presentacional que recibía por props unos 120 valores y callbacks que `CalendarOverlays` (a su vez con un `useCalendar()` de 130 nombres) le reenviaba uno a uno, y mezclaba el día libre, el detalle del evento, el QR, la reunión, el repertorio y seis pestañas de logística.

## Decisión
La barra lateral deja de recibir props: lee el contexto del Calendario (`useCalendar()`), como el resto de vistas. Se sustituye por `src/components/calendar/logistics/`:

- `LogisticsSidebar` (raíz): día libre o detalle del evento, más el pie.
- Día libre: `FreeDayCampaigns` y `UpcomingEventsList`.
- Detalle: `EventDetailPanel` (cabecera del día, selector de eventos del día, previsión, información principal y pestañas), con `MultiDayEventSelector`, `EventWeatherPanel`, `EventCoreInfo`, `ConcertQrWidget`, `RehearsalMeetingWidget` y `EventSetlistWidget`.
- Pestañas: `LogisticsSubtabsBar` y `LogisticsTabContent` (despacha entre hoja de ruta, `RunOfShowTab`, `ContactsTab`, `MerchTab`, `ClosingChecklistTab` y `GearChecklistTab`).

`CalendarOverlays` pinta `<LogisticsSidebar />` sin props y se le quitan ~110 nombres de la desestructuración.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `CalendarSidebarLogistics.tsx` | 1769 | eliminado (la raíz `LogisticsSidebar` tiene ~40) |
| Props de la barra lateral | ~120 | 0 |
| Archivo más grande creado | — | 231 (`LogisticsTabContent`) |
| `any` / `@ts-ignore` en los archivos creados | 3 | 0 |

## Cambios deliberados
- Los valores por defecto de las props opcionales (`upcomingCalendarEvents = []`, callbacks vacíos…) desaparecen: el controlador del Calendario ya entrega esos valores sin `undefined`.
- La unión `string | string[]` de `convocados_nombres` se hace explícita (datos antiguos guardaban texto suelto) en lugar de `any`.
- Los filtros de próximos eventos se tipan con el estado del propio hook.

## Consecuencias
Test de contrato en `logistics/__tests__/`: la raíz no tiene props y usa el contexto, `CalendarOverlays` la pinta sin props, falla fuera del proveedor, vistas <400 líneas y sin `any`, HTML crudo ni persistencia en storage.
