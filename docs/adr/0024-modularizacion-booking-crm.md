# ADR: Modularización de BookingCRM con hooks por subdominio, contexto y vistas

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0023](./0023-modularizacion-pdf-export-modal.md)

## Problema
`src/components/BookingCRM.tsx` tenía 2607 líneas: ~90 sentencias de estado y handlers (navegación entre secciones, filtros, selección masiva, edición de pitch/ficha, rastreo de salas, simulación de negociación, acciones sobre leads) y ~1250 líneas de JSX con cabecera, filtros, barra masiva, tabla/mapa, plantillas y doce modales.

## Decisión
Se mantiene el contrato público (`export default BookingCRM`, `BookingCRMProps` y los re-exports históricos `normalizeStatus`, `normalizeType`, `autoDetectVenueAddress`, `VENUE_ADDRESS_DATABASE`) y se extrae a `components/booking/crm/`:

- **Funciones puras:** `leadTypeMatchers.ts` (clasificadores de medios y grupos), `crmTypes.ts`, `crmTheme.ts`.
- **Hooks:** `useCrmNavigation`, `useLeadSelectionAndTemplates`, `useLeadEditing`, `useLeadFormsAndEnrichment`, `useLeadFiltering`, `useLeadScraping`, `useLeadActions` y el controlador `useBookingCrmController`. Los hooks previos (`useCityChips`, `useEmailTemplates`, `useGmailIntegration`, `useInteractionLog`) se siguen invocando desde ahí.
- **Contexto** `BookingCrmContext` + `BookingCrmProvider` y **vistas**: `BookingCrmLayout`, `BookingHeaderSection` (`HeaderTitleAndActions`, `MobileToolsPanel`, `SearchAndViewRow`), `EnrichBanner`, `FiltersPanelSection`, `ActiveFiltersBar`, `MorningBriefingSection`, `StatusTabsBar`, `RouteAnchorBanner`, `BulkActionsSection`, `ListOrMapArea`, `VenueWorkspaceHost`, `TemplatesConfigCard`, `CrmModalsHost`, `MobileCreateFab`.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `BookingCRM.tsx` | 2607 | ~75 |
| Archivo más grande creado | — | 233 (`MobileToolsPanel`, `BulkActionsSection`) |
| `any` / `@ts-ignore` en los archivos creados | ~20 | 0 |
| ESLint en los archivos creados | no medido | 0 errores, 6 avisos `exhaustive-deps` heredados |

## Cambios deliberados
- `BookingCampaign` declara `is_active?: boolean` (alias heredado de la API que se leía con `as any`).
- `currentUser` pasa de `any` a `User` y `onNavigate` recibe `(view: string, options?: Record<string, unknown>)`.
- Se eliminó código sin uso comprobado con ESLint: valores devueltos de `useInteractionLog`/`useGmailIntegration` (se mantiene la llamada por sus efectos), `instaVal`/`contactoVal` del rastreo y varios setters internos.
- Tres `eslint-disable-next-line react-hooks/set-state-in-effect` justificados (sincronizar sección inicial, abrir el lead pedido, activar el filtro de campaña).

## Defectos preexistentes detectados y NO corregidos
- `matchesMedioType` clasifica por subcadenas muy cortas (`am`, `fm`, `ser`, `tv`): cualquier lead cuyo texto las contenga (p. ej. «Campamento») cae en «radio». Conviene usar palabras completas.
- El rastreo de la ficha descarta el Instagram y el nombre de contacto que devuelve el Scout (se leían y no se usaban).
- Algunos handlers siguen llamando a `fetch`/`apiFetch` con ids de banda desde el cliente; el servidor debe resolver la banda con `getTargetBandId` (AGENTS.md §2.1).
