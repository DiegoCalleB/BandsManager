/**
 * Rutas públicas cargadas bajo demanda y su spinner de carga. Fuera de main.tsx para que el
 * punto de entrada no declare componentes (Fast Refresh).
 */
import { lazy } from 'react';

// Rutas públicas (/epk, /musicos) se cargan bajo demanda
export const PublicEPK = lazy(() => import('../components/PublicEPK'));
export const PublicMusiciansLanding = lazy(() => import('../components/PublicMusiciansLanding'));

/** Spinner a pantalla completa mientras llega el chunk de una ruta pública. */
export function LoadingFallback() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '9999px',
          boxShadow: 'inset 0 0 0 3px rgba(var(--ink-rgb, 42, 46, 53), 0.15), inset 0 0 0 3px var(--acc)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`
    @keyframes spin { to { transform: rotate(360deg); } }
   `}</style>
    </div>
  );
}
