# ADR: Modularización de BandCRM con hooks por subdominio, contexto y vistas

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0024](./0024-modularizacion-booking-crm.md)

## Problema
`src/components/BandCRM.tsx` tenía 2216 líneas: ~70 `useState`, carga de bandas y métricas, formulario con búsqueda por IA, CRUD, acciones masivas (incluida la generación de propuestas de swap), análisis de tono y ~1100 líneas de JSX con cabecera, filtros, tres vistas de listado (mapa, tarjetas, tabla), vista de bandas registradas y seis modales.

## Decisión
Se mantiene el contrato público (`export default BandCRM` y `BandCRMProps`) y se extrae a `components/bandCRM/` (junto a los modales que ya existían allí):

- **Tipos y utilidades:** `bandMetrics.ts` (tipos de métricas y `formatoCompacto`), `bandCrmTypes.ts` (bandas registradas, propuesta IA, respuestas de API), `bandCrmTheme.ts`.
- **Hooks:** `useBandCrmData`, `useBandCrmUiState`, `useBandDerivedData`, `useBandToneAnalysis`, `useBandForm`, `useBandCrud`, `useBandBulkActions` y el controlador `useBandCrmController`.
- **Contexto** `BandCrmContext` + `BandCrmProvider` y **vistas:** `BandCrmLayout`, `BandCrmHeader`, `RegisteredBandsView`, `BandsWorkspace` (`BandsFilterBar`, `BulkBandsBar`, `BandsListContainer` con `BandsEmptyState`, `BandsMapView`, `BandCardsGrid`, `BandsTable`), `BandStatusBadge` (antes una función que devolvía JSX) y `BandCrmModalsHost`.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `BandCRM.tsx` | 2216 | ~40 |
| Archivo más grande creado | — | 313 (`useBandCrud`) |
| `any` / `@ts-ignore` en los archivos creados | ~25 | 0 |
| ESLint en los archivos creados | no medido | 0 errores, 1 aviso `exhaustive-deps` heredado |

## Cambios deliberados
- `activeCampaign` se tipa como `BookingCampaign | null` y `onNavigate` recibe `(view: string, options?: Record<string, unknown>)`.
- Se eliminó código sin uso comprobado con ESLint: la cabecera de autenticación calculada en `handleSaveBand` y `availableStyles`.
- Tres `eslint-disable-next-line` justificados (importación de leads a bandas, carga de registradas, id temporal de leads sin id).

## Defectos preexistentes detectados y NO corregidos
- La campaña activa se lee de `localStorage` con la clave `bandmanager_active_campaign` (sin `band_id`, AGENTS.md §2.5): al cambiar de banda en el mismo navegador podría aparecer la campaña de otra.
- Los modales anteriores de la carpeta (`BandToneModal` 1308 líneas, `AddEditBandModal` 575) siguen con `any` y son candidatos de una siguiente pasada.
