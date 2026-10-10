# ADR: Modularización de TourManager.tsx con controlador, contexto y vistas

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0031](./0031-modularizacion-app.md)

## Problema
`src/components/TourManager.tsx` tenía 1918 líneas: estado del formulario de gira (vehículos, paradas, convocatoria, dietas), apertura del modal, guardado con sincronización a calendario y finanzas, borrado, y el JSX completo de cabecera, tarjetas, modal de edición y confirmación.

## Decisión
Se mantiene el contrato público (`TourManager`, mismas props) y se extrae a `src/components/tour_manager/`:

- **Hooks por subdominio:** `useTourForm` (campos, flota, paradas, dietas), `useTourModal`, `useTourSave`, `useTourDelete` y el controlador `useTourManagerController`.
- **Contexto** `TourManagerContext` + `TourManagerProvider` (`valor = ReturnType<controlador> & props del anfitrión`).
- **Vistas:** `TourManagerView`, `TourManagerHeader`, `TourCardsGrid`, `TourEditModal`, `TourConvocatoriaSection`, `TourFleetSection`, `TourStopsSection`, `TourSyncOptions`, `TourStatsSummary`, `TourDeleteModal`.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `TourManager.tsx` | 1918 | 71 |
| Archivo más grande creado | — | 335 (`TourCardsGrid`) |
| `any` / `@ts-ignore` en los archivos creados | varios | 0 |

## Cambios deliberados
- `onAddPayment` pasa a `Payment` y `onNavigate` a `MainView` (antes `any`).
- `VEHICLE_PRESETS` queda tipado con `fuel` como `TourVehicle["tipoCombustible"]`, eliminando los `as any`.
- La generación de ids de vehículo usa un `eslint-disable-next-line react-hooks/purity` justificado: se ejecuta en un manejador de evento.
- Se elimina `totalIngresos` (calculado y nunca leído) en `useTourSave`.

## Consecuencias
Tests de contrato en `tour_manager/__tests__/`: contenedor <400 líneas, hooks/vistas bien formados, el contexto falla fuera del proveedor, sin `any`, HTML crudo ni persistencia en storage.
