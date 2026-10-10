# ADR: Modularización de BandSwitcherModal con hooks por subdominio, contexto y vistas

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0029](./0029-modularizacion-fans-panel.md)

## Problema
`src/components/BandSwitcherModal.tsx` tenía 1937 líneas: ~25 `useState`, orden y arrastre de bandas, lista única con logos, flujo de creación en dos pasos con selección de plan, salir de una banda, fijar banda principal, subida de logo y ~1300 líneas de JSX con cinco modales anidados.

## Decisión
Se mantiene el contrato público (`BandSwitcherModal`, `BandSwitcherModalProps`) y se extrae a `components/band_switcher/`:

- **Hooks:** `useBandOrdering`, `useBandList`, `useBandReorder`, `useCreateBand`, `useBandActions` y el controlador `useBandSwitcherController`.
- **Contexto** `BandSwitcherContext` + `BandSwitcherProvider`; **tipos** (`SwitcherBand`, `SwitcherEpkConfig`) y **configuración** (`SIMPLE_PROMO_ONLY_BAND_CREATION`).
- **Vistas:** `BandSwitcherLayout`, `BandCardsGrid`, `BandSwitcherFooter`, `BandSettingsModal`, `DeleteBandModal`, `UpgradePlanModal`, `CreateBandModal` (`CreateBandStepOne`, `CreateBandStepTwo` y una tarjeta por plan: `PlanCardEnsayo`, `PlanCardLocal`, `PlanCardDeGira`, `PlanCardCabezaDeCartel`).
- El `if (!isOpen) return null` que cortaba el cuerpo (con hooks por debajo) pasa al contenedor, tras llamar al controlador.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `BandSwitcherModal.tsx` | 1937 | ~40 |
| Archivo más grande creado | — | 275 (`BandCardsGrid`) |
| `any` / `@ts-ignore` en los archivos creados | ~30 | 0 |
| Errores ESLint | no medido | 0 (dos `eslint-disable-next-line` justificados) |

## Cambios deliberados
- Los `catch (err: any)` pasan a `getErrorMessage`; las respuestas de `onSwitchBand`/`onSetMainBand` se tipan `Promise<unknown>`; `epkConfig` pasa a `Partial<EPKConfig>`.
- El test de contratos exime solo la escritura de `bandmanager_user` (sesión) y de `useBandOrdering` (orden por usuario).

## Defectos preexistentes detectados y NO corregidos
- Tras crear o abandonar una banda la pantalla se recarga con `window.location.reload()` en un `setTimeout`, en vez de refrescar el estado.
- `UpgradePlanModal` guarda el usuario actualizado en `localStorage` desde la propia vista.
