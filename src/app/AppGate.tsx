/**
 * Puerta de entrada de la aplicación: rutas públicas (fans, EPK, ofertas, landings), login y,
 * si hay sesión, la aplicación interna.
 */
import {
RefreshCw
} from "lucide-react";
import React,{ Suspense } from "react";
import { FansLanding,LoginModal,PublicDealView,PublicEPK,PublicLanding,PublicMusiciansLanding,PublicTfmLanding,SimplePromoLoginModal } from "../app/lazyViews";


import { useApp } from "./AppContext";

/**
 * Decide qué pantalla mostrar según la ruta y la sesión.
 * @param props.children La aplicación interna, solo cuando hay sesión y no es una ruta pública.
 * @returns La pantalla pública o de acceso, o la aplicación interna.
 */
export function AppGate({ children }: { children: React.ReactNode }) {
  const { currentActiveBandId, currentActiveBandLogo, currentActiveBandName, entrarDesdeLanding, handleLoginSuccess, isDealRoute, isDirectLandingRoute, isEpkRoute, isFanRoute, isLoggedIn, isMusicianRoute, isTfmRoute, verLogin, volverALanding } = useApp();

  if (isMusicianRoute) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[var(--acc)]" />
          </div>
        }
      >
        <PublicMusiciansLanding />
      </Suspense>
    );
  }

  if (isEpkRoute) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[var(--acc)]" />
          </div>
        }
      >
        <PublicEPK />
      </Suspense>
    );
  }

  if (isDealRoute) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
          </div>
        }
      >
        <PublicDealView />
      </Suspense>
    );
  }

  if (isFanRoute) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[var(--acc)]" />
          </div>
        }
      >
        <FansLanding
          currentBandId={currentActiveBandId}
          currentBandName={currentActiveBandName}
          currentBandLogo={currentActiveBandLogo}
        />
      </Suspense>
    );
  }

  // Landing TFM dedicada (/landingpage_TFM, /landing-tfm, /tfm)
  // Accesible en cualquier momento (incluso usuarios registrados/logueados)
  if (isTfmRoute && !verLogin) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[var(--bg)]" />}>
        <PublicTfmLanding onEntrar={entrarDesdeLanding} />
      </Suspense>
    );
  }

  // Landing Oficial dedicada (/landing, /landing-oficial, /?landing=true)
  // Accesible en cualquier momento para enseñarla a salas, fans, socios o amigos
  if (isDirectLandingRoute && !verLogin) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[var(--bg)]" />}>
        <PublicLanding onEntrar={entrarDesdeLanding} />
      </Suspense>
    );
  }

  // Auth Screen Render
  // Fase beta: ventana de acceso simplificada (login + alta directa en plan Promo, sin
  // selector de planes) para los primeros usuarios (bandas del festival Buskers). El
  // LoginModal completo (con la parrilla de 4 planes) se conserva intacto para cuando se
  // quiera reabrir el registro público con todos los planes — basta con volver a poner
  // esta constante a false.
  const USE_SIMPLE_LOGIN = true;

  if (!isLoggedIn && !verLogin) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[var(--bg)]" />}>
        <PublicLanding onEntrar={entrarDesdeLanding} />
      </Suspense>
    );
  }

  if (!isLoggedIn) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[var(--acc)]" />
          </div>
        }
      >
        {USE_SIMPLE_LOGIN ? (
          <SimplePromoLoginModal onLoginSuccess={handleLoginSuccess} onVolverALanding={volverALanding} />
        ) : (
          <LoginModal onLoginSuccess={handleLoginSuccess} />
        )}
      </Suspense>
    );
  }

  return <>{children}</>;
}
