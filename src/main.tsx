import './utils/domTranslatePatch';
import { initFrontendErrorTracking } from './utils/errorTracking';
import { instalarAvisoDeGuardados } from './utils/saveErrors';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { LanguageProvider } from './context/LanguageContext';
import '@fontsource-variable/onest';
import './index.css';
import { escucharSistema, leerPreferencia as leerPreferenciaEspectro } from './utils/temaEspectro';
import { capturarReferidoDeLaUrl } from './utils/referido';
import { iniciarAnalitica, registrarEvento } from './utils/analitica';
import { LoadingFallback, PublicEPK, PublicMusiciansLanding } from './app/rutasPublicasLazy';

// Inicializa el rastreo de errores del cliente si VITE_SENTRY_DSN está presente
initFrontendErrorTracking();

// Analítica sin cookies (Plausible): solo se activa si VITE_PLAUSIBLE_DOMAIN está definido.
iniciarAnalitica();

// Cualquier guardado (POST/PUT/PATCH/DELETE a /api) que falle muestra un aviso en pantalla.
instalarAvisoDeGuardados();

// Tema «Espectro»: el atributo data-theme ya se estampó antes de este punto (script
// inline en index.html, para no parpadear en la primera carga). Esto solo mantiene el
// tema sincronizado con el sistema operativo MIENTRAS la app está abierta, si la
// preferencia guardada es'system' — sin esto, elegir "Automático" y luego cambiar el
// modo oscuro del móvil no se notaría hasta recargar. Vive aquí (arranque, se monta una
// sola vez) y no en UserProfileModal, que puede cerrarse.
escucharSistema(leerPreferenciaEspectro);

// Invitación de otra banda (?ref=): se guarda 30 días y se atribuye cuando la persona tenga cuenta.
if (capturarReferidoDeLaUrl()) registrarEvento('Invitacion Recibida');

// Rutas públicas accesibles sin autenticación
const pathname = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
const esRutaPublicaEpk = /^\/epk\/?$/.test(pathname);
const esRutaPublicaMusicos = /^\/(musicos|musicians|para-musicos|waitlist-musicos)\/?$/.test(pathname);

// El EPK se monta FUERA de LanguageProvider a propósito: ese provider inyecta el widget de
// Google Translate, que traduce a nivel de DOM y destroza nombres propios y jerga ("Mi Banda",
// "Electrobasureo"). En un documento cuyo único trabajo es parecer profesional eso no vale, y
// además pelearía con el selector de idioma propio de la página (ver useEpkLanguage). PublicEPK
// no usa useLanguage() en ningún sitio, así que no necesita el contexto para nada.
// PWA: solo en producción, para no interferir con el hot-reload del dev server ni con vitest.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Si ya había una pestaña bajo control de un SW previo, un cambio de controlador significa
  // que se activó una versión nueva (que ya purgó las cachés viejas, ver sw.js): recargamos una
  // sola vez para que la interfaz se ponga al día sin que el usuario tenga que borrar nada a
  // mano. En la primera visita nunca hay controller todavía, así que no dispara un refresco fantasma.
  const hadController = !!navigator.serviceWorker.controller;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* sin service worker la app funciona igual, solo sin caché offline */ });
  });
  if (hadController) {
    let hasReloadedForUpdate = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hasReloadedForUpdate) return;
      hasReloadedForUpdate = true;
      window.location.reload();
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        {esRutaPublicaEpk ? (
          <PublicEPK />
        ) : esRutaPublicaMusicos ? (
          <PublicMusiciansLanding />
        ) : (
          <LanguageProvider>
            <App />
          </LanguageProvider>
        )}
      </Suspense>
    </ErrorBoundary>
  </StrictMode>
);
