# ADR: Modularización de CalendarEventDetailModal con controlador, contexto y vistas por pestaña

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0025](./0025-modularizacion-band-crm.md)

## Problema
`src/components/calendar/CalendarEventDetailModal.tsx` tenía 2142 líneas: ~70 props recibidas del calendario, estado local (menús, formularios de contactos, merchandising y cierre, navegación táctil/cronológica, hoja de ruta) y un único JSX con cabecera, confirmación de borrado, avisos de festivo y clima, y seis pestañas (resumen, técnica, contactos, merchandising, post-show y cierre).

## Decisión
Se mantiene el contrato público (`CalendarEventDetailModal` y `CalendarEventDetailModalProps`, consumido solo por `CalendarOverlays`) y se extrae a `calendar/event_detail/`:

- **Controlador:** `hooks/useEventDetailController` (estado local y datos derivados de la ficha).
- **Contexto:** `EventDetailContext` + `EventDetailProvider`; valor = retorno del controlador + props del modal, para que cada vista lea solo lo que usa.
- **Vistas:** `EventDetailLayout`, `EventTopBar`, `EventHeaderSection`, `DeleteConfirmPanel`, `HolidayWarningSection`, `EventWeatherSection`, `EventTabsNav` y una vista por pestaña (`OverviewTab`, `TechnicalLogisticsTab`, `KeyContactsTab`, `PostShowTab`, `ClosingChecklistTab`).
- **Merchandising** (era una pestaña de ~700 líneas): `MerchandisingTab` compone `merch/MerchHeader`, `MerchKpiGrid`, `MerchAddForm`, `MerchItemsTable` y `MerchCashPanel`; los totales viven en `merch/useMerchControl` y las categorías en `merch/merchCategories`.
- **Tipos compartidos** en `calendarTypes.ts`: `ChronologicalEvent` y `BandIdentity` (antes `any`).

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `CalendarEventDetailModal.tsx` | 2142 | ~100 |
| Archivo más grande creado | — | 229 (`TechnicalLogisticsTab`) |
| `any` / `@ts-ignore` en los archivos creados | ~12 | 0 |
| Cabeceras `eslint-disable` en los archivos creados | 14 | 0 |

## Cambios deliberados
- `allChronologicalEvents` y `getBandIdentity` pasan de `any` a tipos reales; los alias heredados de banda se leen con `BandTaggedEvent`.
- Se eliminaron manejadores táctiles vacíos y estado sin uso (`setMerchCopiedToast`, `setCopiedEventModalId`, `modalWeatherAlertsState`), verificado con ESLint.

## Defectos preexistentes detectados y NO corregidos
- El controlador duplica estado de merchandising (`merchCopiedToast`, `newMerchCategoria`…) que también mantiene `useCalendarRoadbook`; al spread `...props` ganan los del padre, por lo que las copias del controlador son código muerto en la práctica.
- `Concert` no declara `hora`: se lee con un cast tipado (`Concert & { hora?: string }`) y cae a `21:30`.
