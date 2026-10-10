# ADR: Modularización de GooglePlacesExplorerModal.tsx con controlador, contexto y vistas

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0032](./0032-modularizacion-tour-manager.md)

## Problema
`src/components/booking/GooglePlacesExplorerModal.tsx` tenía 1872 líneas: filtros, cinco tipos de búsqueda (manual, campaña masiva, bandas similares, multifuente y radar cultural), selección de resultados, descartados persistidos, extracción de emails, importación al CRM y ~850 líneas de JSX.

## Decisión
Se mantiene el contrato público (`GooglePlacesExplorerModal`, mismas props, usado por `CrmModalsHost`) y se extrae a `src/components/booking/google_places/`:

- **Modelo** `placesModel.ts`: `PlaceResult`, `DiscardedPlace`, `CATEGORIES`, `QUICK_CITIES`, almacenamiento de descartados, tipos de respuesta de cada radar y `errorMessage`.
- **Hooks por subdominio:** `useScoutFilters`, `usePlaceResults`, `useDiscardedPlaces`, `usePlaceSearch`, `useMassCampaignSearch`, `useAlternativePlaceSources`, `usePlaceEmailExtraction`, `usePlaceCrmImport` y el controlador `useGooglePlacesExplorerController`.
- **Contexto** `GooglePlacesExplorerContext` + `GooglePlacesExplorerProvider` (`valor = ReturnType<controlador> & props`).
- **Vistas:** `GooglePlacesExplorerView`, `ExplorerHeader`, `MassCampaignPanel`, `PlaceDiscardToast`, `ScoutFilterBar`, `PlaceStatusBanners`, `PlacesResultsList`, `PlaceDiscardedModal`.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `GooglePlacesExplorerModal.tsx` | 1872 | ~40 |
| Archivo más grande creado | — | 313 (`PlacesResultsList`) |
| `any` / `@ts-ignore` / `catch {}` vacíos en los archivos creados | 17 `any` | 0 |

## Cambios deliberados
- Las respuestas de los radares se tipan (`SimilarVenueItem`, `MultiSourceVenueItem`, `CulturalOpportunityItem`) en vez de `any`; los errores se leen con `errorMessage(err: unknown)`.
- El `if (!isOpen) return null` pasa al contenedor; los hooks se siguen ejecutando siempre en el mismo orden.
- La resincronización con la campaña activa mantiene un `eslint-disable` justificado de `react-hooks/set-state-in-effect`.

## Deuda conocida
Los descartados se guardan en `localStorage` con la clave global `bandmanager_scout_discarded_places`, **sin `band_id`** (AGENTS.md §2.5). Se conserva el comportamiento para no perder los descartes de los usuarios; queda documentado en el test de contrato y pendiente de migrar a una clave por banda.
