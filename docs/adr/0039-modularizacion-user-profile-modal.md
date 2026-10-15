# ADR: Modularización de UserProfileModal.tsx con hooks, contexto y vistas por sección

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0038](./0038-modularizacion-onboarding-wizard.md)

## Problema
`src/components/UserProfileModal.tsx` tenía 1721 líneas: datos personales, logo de la banda, plan efectivo, alta y baja de bandas, contraseña, idioma, apariencia, acceso a agentes y notificaciones, guardado y ~1270 líneas de JSX con un formulario de once secciones y un diálogo de planes de 290 líneas.

## Decisión
Se mantiene el contrato público (`UserProfileModal`, mismas props, usado por `AppModalsHost`) y se extrae a `src/components/user_profile/`:

- **Hooks:** `useProfileIdentity` (nombre, instrumento, color, banda principal y logo), `usePlanSummary` (plan efectivo y si el usuario es promocional), `useProfileBands` (alta y baja de bandas) y el controlador `useUserProfileController` (contraseña, paneles, guardado).
- **Contexto** `UserProfileContext` + `UserProfileProvider`; `ResolvedUserProfileProps` recoge las props con sus valores por defecto.
- **Vistas:** `UserProfileView` y una por sección: `ProfileHeader`, `ProfilePlanSection`, `IdentityFields`, `BandLogoSection`, `BandSelectionSection` (+ `BandCreateForm`, `BandDeleteConfirm`), `LanguageSelector`, `AppearanceSettings`, `EspectroPreferenceCard`, `AgentConfigCard`, `NotificationSettingsCard`, `PasswordSection`, `AdminBandSection`, `ProfileFooter` y `UpgradePlanDialog`.
- **Constantes** `profileModel.ts`: `SIMPLE_PROMO_ONLY_BAND_CREATION` e `isStitchLight` (esta última, una constante `false` heredada).

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `UserProfileModal.tsx` | 1721 | 57 |
| Archivo más grande creado | — | 311 (`UpgradePlanDialog`) |
| `any` / `@ts-ignore` / `catch {}` vacíos en los archivos creados | 13 | 0 |

## Cambios deliberados
- `epkConfig` pasa de `any` a `Partial<EPKConfig> | null`; `onUpdateEpkConfig` y `onSetMainBand` dejan de devolver `Promise<any>`.
- Los errores se leen con `instanceof Error`; el cambio de plan ya no hace `as any` al llamar a `api.updateUser`.
- El portal de facturación de Stripe mantiene su `catch` silencioso, ahora comentado (si falla, el usuario sigue en el perfil).
- `ProfilePlanSection` agrupa además el aviso de éxito del formulario, que va pegado a ella.

## Deuda conocida
`useProfileBands` y `UpgradePlanDialog` guardan `bandmanager_user` en `localStorage` tras un alta o un cambio de plan. Es la sesión del propio usuario y no datos de banda (AGENTS.md §2.5), por lo que el test de contrato los exime; conviene centralizarlo en un único servicio de sesión.

## Consecuencias
Tests de contrato en `user_profile/__tests__/`: contenedor <400 líneas, vistas y hooks bien formados y <400 líneas, el contexto falla fuera del proveedor, la creación de bandas sigue limitada a Promo en beta, y sin `any` ni HTML crudo.
