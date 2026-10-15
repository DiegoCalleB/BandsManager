# ADR: Modularización de FansPanel con hooks por subdominio, contexto y vistas

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0028](./0028-modularizacion-fans-landing.md)

## Problema
`src/components/FansPanel.tsx` tenía 2051 líneas: pestañas, filtros y métricas derivadas, ciudades configurables, incentivo de bienvenida, alta manual, configuración y exportación del QR, y ~1300 líneas de JSX con cuatro pestañas y varios modales.

## Decisión
Se mantiene el contrato público (`FansPanel`, `FansPanelProps`, export por defecto) y se extrae a `components/fans_panel/`:

- **Hooks por subdominio:** `useQrCustomization`, `useFanIncentive`, `useFansFilters`, `useCityChips`, `useManualFanForm`, `useQrLink`, `useQrSharing` y el controlador `useFansPanelController`.
- **Contexto** `FansPanelContext` + `FansPanelProvider`.
- **Vistas:** `FansPanelBody` (`FansPanelHeader`, pestañas, modales), `FansListTab` (`FansCityTabsBar`, `FansToolbar`, `FansGridView`, `FansMapView`, `FansTableView`), `FansQrTab` (`QrPreviewCard`, `QrAdvancedConfig`) y `FansAddModal`.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `FansPanel.tsx` | 2051 | ~55 |
| Archivo más grande creado | — | 330 (`QrAdvancedConfig`) |
| `any` / `@ts-ignore` en los archivos creados | 4 | 0 |
| Errores ESLint en estos archivos | no medido | 0 (cinco `eslint-disable-next-line` justificados: sincronización de estado con props) |

## Defectos preexistentes detectados y NO corregidos
- `useCityChips` guarda las ciudades en `localStorage` con la clave `bandmanager_custom_cities`, sin `band_id` (AGENTS.md §2.5); el hook duplicado `src/hooks/useCityChips.ts` hace lo mismo. Con varias bandas en el mismo navegador se pisan. El test de contratos lo exime explícitamente.
- `useQrLink` omite `selectedConcert` de las dependencias de un efecto (aviso `exhaustive-deps` heredado).
