# ADR: Modularización de OnboardingWizardModal.tsx con un hook por paso, contexto y vistas

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0037](./0037-modularizacion-calendar-sidebar-logistics.md)

## Problema
`src/components/onboarding/OnboardingWizardModal.tsx` (asistente de configuración inicial de la banda) tenía 1736 líneas: más de 200 `useState`, 30 manejadores (Spotify, subida de audio, riders, eventos, fotos…), una hidratación desde el EPK, el guardado final, la lista de pasos según el plan y ~420 líneas de JSX con cabecera, barra de pasos, 14 pasos ya extraídos pero cableados a mano con decenas de props, y pie.

## Decisión
Se mantiene el contrato público (`OnboardingWizardModal`, mismas props, usado por `AppModalsHost`) y se extrae a `src/components/onboarding/wizard/`:

- **Un hook por paso:** `useIdentityStep`, `useBioStep`, `useMembersStep`, `useSocialsMerchStep`, `useVideosStep`, `useMusicSetlistStep`, `useRiderStep`, `usePressProofStep`, `useBookingAndAgentStep`, `useEventsStep`, `usePhotosStep` y `useFansPaymentsStep`, más `useWizardSteps` (pasos según el plan y paso actual).
- **Controlador** `useOnboardingWizardController`: compone los hooks, hidrata el estado desde el EPK, guarda y navega.
- **Contexto** `OnboardingWizardContext` + `OnboardingWizardProvider`; `ResolvedOnboardingWizardProps` recoge las props con sus valores por defecto.
- **Vistas:** `OnboardingWizardView`, `WizardHeader`, `WizardStepper`, `WizardStepsEarly`, `WizardStepsLate` y `WizardFooter`. Los 14 componentes `Step*` no se tocan: siguen recibiendo props explícitas.
- **Soporte:** `wizardOptions.ts` (géneros e idiomas) y `epkLegacy.ts` (`epkDe`, `EpkWizardExtras`).

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `OnboardingWizardModal.tsx` | 1736 | 52 |
| Archivo más grande creado | — | 359 (`useMusicSetlistStep`) |
| `any` / `@ts-ignore` en los archivos creados | 46 | 0 (solo el adaptador `epkLegacy`, sin `any`) |

## Cambios deliberados
- Los campos que el asistente escribe en el EPK sin figurar en `EPKConfig` (rider, caché de festival, condiciones, tienda de merchandising…) se declaran en `EpkWizardExtras` en vez de `(epkConfig as any)`; `festivalesDestacados` se documenta como texto libre.
- `onUpdateEpkConfig` pasa de `(config: any)` a `Partial<EPKConfig> & EpkWizardExtras`.
- La respuesta de `/api/spotify/search` se tipa (`SpotifySearchResponse`) y los alta de ensayo y concierto desde el asistente se tipan como `Rehearsal` y `Concert`.
- La hidratación mantiene un `eslint-disable` justificado de `exhaustive-deps` (los setters son estables).
- El `return null` de cierre pasa al contenedor, tras todos los hooks.

## Consecuencias
Tests de contrato en `wizard/__tests__/`: contenedor <400 líneas, hooks y vistas bien formados y <400 líneas, el contexto falla fuera del proveedor, adaptadores del EPK y opciones del asistente, y sin `any`, HTML crudo ni persistencia en storage.
