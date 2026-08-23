import {StrictMode, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary';
import { LanguageProvider } from './context/LanguageContext';
import './index.css';

// App (todo el panel interno: CRM, calendario, reels, repertorio...) y PublicEPK (la única
// ruta pública además de /fans) se cargan bajo demanda y por separado: quien abre /epk no
// necesita descargar el panel interno, y viceversa.
const App = lazy(() => import('./App.tsx'));
const PublicEPK = lazy(() => import('./components/PublicEPK'));

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

// /epk es la única ruta pública de la app: es el enlace que los agentes meten en los pitches,
// así que lo abre gente de fuera (programadores de salas, prensa) que NO tiene cuenta. Se
// resuelve aquí, antes de montar App, para no pasar por su pantalla de login - sin esto la
// página existía pero era inalcanzable y el enlace acababa en "Entrar a mi cuenta".
const esRutaPublicaEpk = typeof window !== 'undefined' && /^\/epk\/?$/.test(window.location.pathname);

// El EPK se monta FUERA de LanguageProvider a propósito: ese provider inyecta el widget de
// Google Translate, que traduce a nivel de DOM y destroza nombres propios y jerga ("Bakandeya",
// "Electrobasureo"). En un documento cuyo único trabajo es parecer profesional eso no vale, y
// además pelearía con el selector de idioma propio de la página (ver useEpkLanguage). PublicEPK
// no usa useLanguage() en ningún sitio, así que no necesita el contexto para nada.
// PWA: solo en producción, para no interferir con el hot-reload del dev server ni con vitest.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        {esRutaPublicaEpk ? (
          <PublicEPK />
        ) : (
          <LanguageProvider>
            <App />
          </LanguageProvider>
        )}
      </Suspense>
    </ErrorBoundary>
  </StrictMode>,
);
