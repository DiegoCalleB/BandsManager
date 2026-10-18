# ADR: Modularización de FansLanding con hooks por subdominio, contexto y vistas

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0026](./0026-modularizacion-calendar-event-detail-modal.md)

## Problema
`src/components/FansLanding.tsx` tenía 2106 líneas: idioma del formulario, estado del formulario Únete, carga del perfil público de la banda (identidad, redes, pagos, miembros, conciertos), telemetría de clics, reproductor de audio, enlaces de pago (Revolut, PayPal, Bizum), envío del alta y ~1500 líneas de JSX con la pantalla de éxito y la principal.

## Decisión
Se mantiene el contrato público (`FansLanding`, `FansLandingProps`, export por defecto; lo consume `FansLandingPreviewModal`) y se extrae a `components/fans_landing/`:

- **Hooks por subdominio:** `useFanLanguage`, `useFanJoinForm`, `useFanBandProfile`, `useFanEngagement`, `useAudioPreview`, `useFanPayments`, `useFanSignupSubmit` y el controlador `useFansLandingController`.
- **Contexto** `FansLandingContext` + `FansLandingProvider`, **tipos** en `fanLandingTypes.ts` (`FanSignupResult`, `FanIncentive`, `PublicHighlightedSong`).
- **Vistas:** `FansLandingSuccess`, `FansLandingForm` → `FansLandingBody` (`FanIdentityHeader`, `AudioPreviewPlayer`, `LandingTabSwitcher`, `SocialLinksTab`, `SignupFormTab`, `BookingContactSection`, `MusiciansBanner`, `PrivacyPolicyModal`), `DonationCard` (antes `renderRevolutCard`, una función que devolvía JSX) y `FanFormLanguageSwitcher`.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `FansLanding.tsx` | 2106 | ~50 |
| Archivo más grande creado | — | 354 (`FansLandingSuccess`) |
| `any` / `@ts-ignore` en los archivos creados | 4 | 0 |
| Errores ESLint en estos archivos | 17 | 0 (cuatro `eslint-disable-next-line` justificados: sincronización del modo previsualización) |

## Cambios deliberados
- El estado `selectedPaymentMethod` se eliminó: se escribía pero nunca se leía.
- La respuesta del alta se tipa (`FanSignupResult`) y el error de red usa `getErrorMessage`.
- El reproductor de audio (`toggleAudioPreview`) vive ya en su hook, no en el componente.

## Defectos preexistentes detectados y NO corregidos
- Los `useEffect` de sincronización con el modo previsualización y de carga del perfil omiten dependencias a propósito (se ejecutan una vez); dos avisos `exhaustive-deps` heredados.
- `FansLandingSuccess` (354 líneas) agrupa todavía el bloque de beneficios y los accesos sociales; es candidato a una segunda pasada.
