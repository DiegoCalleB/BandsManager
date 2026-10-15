# ADR: Modularización de App.tsx con controlador, contexto, puerta de entrada y armazón

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0030](./0030-modularizacion-band-switcher-modal.md)

## Problema
`src/App.tsx` tenía 2814 líneas: 31 vistas y modales cargados con `safeLazy`, sesión y datos, banda activa y plan, límites de plan, navegación y notificaciones, tema y tipografía, estado del armazón, detección de ruta pública y de acceso, ocho `return` tempranos para rutas públicas y ~1500 líneas de JSX con barra lateral, cabecera y barra inferior móviles, vista activa y modales globales.

## Decisión
Se mantiene el contrato público (`export default function App`, usado por `main.tsx`) y se extrae a `src/app/`:

- **Carga diferida:** `lazyViews.ts` (`safeLazy` tipado, sin `any`, y las 31 vistas/modales).
- **Hooks por subdominio:** `useActiveBand`, `usePlanLimitGuards`, `useShellState`, `useAppNavigation`, `useAppTheme`, `useGlobalStudio`, `useNavState`, `useHashRoute` y el controlador `useAppController`. `MainView` se mueve a `appViews.ts` (antes un tipo local duplicado en la firma de `handleNavigate`).
- **Contexto** `AppContext` + `AppProvider`.
- **Puerta de entrada** `AppGate`: rutas públicas (fans, EPK, ofertas, landings), login y, con sesión, los hijos.
- **Armazón** `AppShell`: `MobileTopBar`, `MobileBottomTabBar`, `MobileGroupSheet`, `MobileDrawer`, `DesktopSidebar`, `AppMainContent` → `ActiveViewRouter`, y `AppModalsHost`.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `App.tsx` | 2814 | 24 |
| Archivo más grande creado | — | 378 (`DesktopSidebar`) |
| `any` / `@ts-ignore` / `no-empty` en los archivos creados | cabecera `eslint-disable` global | 0, sin cabecera |
| Errores ESLint | ocultos por el `eslint-disable` global | 0 (tres `eslint-disable-next-line` justificados); 7 avisos `exhaustive-deps` que antes estaban silenciados |

## Cambios deliberados
- Los `return` tempranos de `App` pasan a `AppGate`; los hooks siguen ejecutándose siempre en el mismo orden (el controlador va antes de cualquier `return`).
- `SwitcherBand` gana los alias heredados `id`/`name`, `handleNavigate` recibe `MainView` en vez de `as any` en cada llamada.
- Se eliminó `isStitchLight` (constante `false` sin lectores).

## Defectos preexistentes detectados y NO corregidos
- Siete efectos y `useMemo` omiten dependencias a propósito (refresco de sesión, `isSameBand`); eran invisibles por el `eslint-disable` de cabecera.
- Varias claves de `localStorage` del armazón no llevan `band_id` (tema, grupos de navegación abiertos, onboarding global) y se comparten entre bandas del mismo navegador.
