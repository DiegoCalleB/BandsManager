import './utils/domTranslatePatch';
import {StrictMode, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { LanguageProvider } from './context/LanguageContext';
import './index.css';

// Rutas públicas (/epk, /musicos) se cargan bajo demanda
const PublicEPK = lazy(() => import('./components/PublicEPK'));
const PublicMusiciansLanding = lazy(() => import('./components/PublicMusiciansLanding'));

const LoadingFallback = () => (
  <div style={{ minHeight: '100vh', background: '#121111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: '9999px',
        border: '3px solid rgba(242, 202, 80, 0.25)',
        borderTopColor: '#f2ca50',
        animation: 'spin 0.8s linear infinite'
      }}
    />
    <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
  </div>
);

// Rutas públicas accesibles sin autenticación
const pathname = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
const esRutaPublicaEpk = /^\/epk\/?$/.test(pathname);
const esRutaPublicaMusicos = /^\/(musicos|musicians|para-musicos|waitlist-musicos)\/?$/.test(pathname);

// El EPK se monta FUERA de LanguageProvider a propósito: ese provider inyecta el widget de
// Google Translate, que traduce a nivel de DOM y destroza nombres propios y jerga ("Bakandeya",
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
    navigator.serviceWorker.register('/sw.js').catch(() => {});
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
  </StrictMode>,
);
