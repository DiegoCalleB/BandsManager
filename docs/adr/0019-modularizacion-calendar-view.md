# ADR: Modularización de CalendarView con hooks por subdominio, contexto y vistas

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0018](./0018-modularizacion-reels-center.md)

## Problema
`src/components/CalendarView.tsx` tenía 3423 líneas: ~100 `useState`, ~60 handlers/derivados (bandas visibles, preferencias de vista, navegación táctil, ficha de evento, logística del día, recordatorios, compartir) y ~1400 líneas de JSX (cabecera, buscador, rejillas, agenda del día con tarjetas de concierto y ensayo) además de los modales ya existentes en `calendar/`.

## Decisión
Se mantiene el contrato público (`export default CalendarView` y `getDetailedDateInfo`) y se extrae a `components/calendar/`:

- **Hooks por subdominio** (`hooks/`): `useCalendarBands`, `useBandMembers`, `useCalendarFeed`, `useCalendarViewPrefs`, `useCalendarDates`, `useCalendarFilters`, `useCreateEventForm`, `useCalendarFullscreen`, `useEventFicha`, `useUpcomingEvents`, `useCalendarNavigation`, `useConcertSyncMessages`, `useEventInlineEdit`, `useSelectedEventDetails`, `useEventReminder`, `useRunOfShowAndGear`, `useEventShareActions`.
- **Controlador** `useCalendarController`, **contexto** `CalendarContext` + `CalendarProvider` (valor = retorno del controlador + props de la pantalla).
- **Vistas** (`views/`): `CalendarLayout`, `CalendarTitleBar`, `CalendarSearchBar`, `MonthNavigationBar` (`PeriodNavigation`, `ViewSwitchers`, `BandFilterToggle`), `CalendarSyncNotices`, `MonthGrids`, `SelectedDayAgenda` (`DayAgendaHeader`, `DayEventSelector`, `ConcertDetailCard`, `RehearsalDetailCard`), `CalendarLegend`, `CalendarOverlays` (barra lateral, modales y modo escenario).
- Tipos compartidos en `calendarTypes.ts` (`CalendarBand`, `CalendarUser`, `BandTaggedEvent`) y `calendarTheme.ts` (`isStitchLight`).
- El reordenado de sentencias por subdominio se hizo con el compilador de TypeScript antes de extraer; no hay dependencias cíclicas.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `CalendarView.tsx` | 3423 | ~70 |
| Archivo más grande creado | — | 298 (`CalendarOverlays`) |
| `any` / `@ts-ignore` en los archivos creados | ~50 | 0 |
| ESLint en los archivos creados | no medido | 0 errores, 1 aviso `exhaustive-deps` heredado (`getEventBandName` en `useUpcomingEvents`) |

## Código muerto eliminado (recuperable desde git)
Comprobado con ESLint/compilador: el modal unificado `CalendarCreateEventModal` ya tenía su propio estado y guardado, así que en la pantalla quedaban sin usar el formulario de alta (reuniones, ensayos y conciertos: ~25 estados y los handlers `handleSaveNewRehearsal/Reunion/Concert`), `handleSyncConcerts`, los handlers de edición en línea (`handleSaveConcertEdit/RehearsalEdit`), los gestos táctiles del modal de ficha, `fullWeekdays`, el filtro de agenda pasada, `syncScope`/`copiedFeed`/`errorFeed` y el estado del tutorial abierto.

## Defectos preexistentes detectados y NO corregidos
- El recordatorio por email lee `m.email` de `effectiveBandMembers`, pero los miembros que construye `useBandMembers` (`id`, `name`, `role`) no traen email: salvo que `bandUsers` lo incluya, `recipientEmails` queda vacío.
- `useRunOfShowAndGear` consulta `/api/logistics?band_id=…` enviando el id de banda desde el cliente; el servidor debe resolverlo con `getTargetBandId` e ignorar el parámetro (AGENTS.md §2.1).
- Los logos personalizados se leen de `localStorage` (`bandmanager_custom_band_logos`) indexados por id de banda.
- `ModuleTutorialModal` no se renderiza en el calendario (solo se abre el tutorial desde el disparador).
- `calendarTypes.ts` conserva 2 errores ESLint antiguos (`MerchBoloItem` sin usar, asignaciones inútiles en `getDetailedDateInfo`).
