import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import PublicEPK from './components/PublicEPK';
import ErrorBoundary from './components/ErrorBoundary';
import { LanguageProvider } from './context/LanguageContext';
import './index.css';

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
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {esRutaPublicaEpk ? (
        <PublicEPK />
      ) : (
        <LanguageProvider>
          <App />
        </LanguageProvider>
      )}
    </ErrorBoundary>
  </StrictMode>,
);
