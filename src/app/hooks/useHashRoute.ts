/**
 * Detección de la ruta pública y estado del acceso (login) según la URL.
 * Extraído de App.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React from "react";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface HashRouteParams {
  isLoggedIn: boolean;
}

/**
 * Detección de la ruta pública y estado del acceso (login) según la URL.
 * @param params Estado y callbacks del contenedor ({@link HashRouteParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useHashRoute({ isLoggedIn }: HashRouteParams) {
  const [rutaActual, setRutaActual] = React.useState<string>(() =>
    typeof window !== "undefined" ? window.location.pathname.toLowerCase() : "/"
  );

  // Public Landing Routes
  const isFanRoute = React.useMemo(() => {
    const p = rutaActual;
    return (
      p.startsWith("/fans") ||
      p.startsWith("/unete") ||
      p.startsWith("/directo") ||
      p.startsWith("/fan")
    );
  }, [rutaActual]);

  const isMusicianRoute = React.useMemo(() => {
    const p = rutaActual;
    return (
      p.startsWith("/musicos") ||
      p.startsWith("/landing-musicos") ||
      p.startsWith("/musicians") ||
      p.startsWith("/artistas") ||
      p.startsWith("/waitlist") ||
      p.startsWith("/bandas-registro")
    );
  }, [rutaActual]);

  const isEpkRoute = React.useMemo(() => {
    const p = rutaActual;
    return (
      p.startsWith("/epk") || p.startsWith("/dossier") || p.startsWith("/press")
    );
  }, [rutaActual]);

  const isDealRoute = React.useMemo(() => {
    const p = rutaActual;
    return (
      p.startsWith("/deal") ||
      p.startsWith("/acuerdo") ||
      p.startsWith("/contrato")
    );
  }, [rutaActual]);

  const isTfmRoute = React.useMemo(() => {
    const p = rutaActual;
    const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
    return (
      p.startsWith("/landingpage_tfm") ||
      p.startsWith("/landingpage-tfm") ||
      p.startsWith("/landing-tfm") ||
      p.startsWith("/tfm") ||
      search.get("tfm") === "true"
    );
  }, [rutaActual]);

  const isDirectLandingRoute = React.useMemo(() => {
    const p = rutaActual;
    const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
    return (
      p === "/landing" ||
      p.startsWith("/landing/") ||
      p === "/landing-oficial" ||
      p === "/landingpage" ||
      p === "/landingpage_oficial" ||
      p === "/oficial" ||
      p === "/home" ||
      p === "/info" ||
      search.get("landing") === "true" ||
      search.get("ver") === "landing"
    );
  }, [rutaActual]);

  // Landing pública: solo en la raíz, sin sesión y sin parámetros (los enlaces de OAuth/invitación
  // traen query y deben ir directos al login). La app instalada (PWA) salta la landing.
  // Si el usuario ya se ha registrado previamente en este dispositivo, va directo a la pantalla de login.
  // EXCEPCIÓN: si se accede explícitamente a /landing, /landing-oficial o /landingpage_tfm, NO forzar login para permitir enseñar la landing.
  const [verLogin, setVerLogin] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const { pathname, search, hash } = window.location;
    const p = pathname.toLowerCase();
    const urlParams = new URLSearchParams(search);

    const esLandingDirecta =
      p === "/landing" ||
      p.startsWith("/landing/") ||
      p === "/landing-oficial" ||
      p === "/landingpage" ||
      p === "/landingpage_oficial" ||
      p === "/oficial" ||
      p === "/home" ||
      p === "/info" ||
      p.startsWith("/landingpage_tfm") ||
      p.startsWith("/landingpage-tfm") ||
      p.startsWith("/landing-tfm") ||
      p.startsWith("/tfm") ||
      urlParams.get("landing") === "true" ||
      urlParams.get("tfm") === "true" ||
      urlParams.get("ver") === "landing";

    if (esLandingDirecta) return false;

    const raiz = pathname === "/" || pathname === "/index.html";
    const instalada =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    const yaRegistrado =
      localStorage.getItem("bandmanager_registered_user") === "true" ||
      localStorage.getItem("bandmanager_remember_me") === "true" ||
      Boolean(localStorage.getItem("bandmanager_user"));
    return !raiz || !!search || !!hash || instalada || yaRegistrado;
  });

  React.useEffect(() => {
    const alVolver = () => {
      const p = window.location.pathname.toLowerCase();
      setRutaActual(p);
      if (p === "/" || p === "/index.html") {
        const yaRegistrado =
          localStorage.getItem("bandmanager_registered_user") === "true" ||
          localStorage.getItem("bandmanager_remember_me") === "true" ||
          Boolean(localStorage.getItem("bandmanager_user"));
        if (!yaRegistrado) {
          setVerLogin(false);
        }
      } else if (
        p === "/landing" ||
        p.startsWith("/landing/") ||
        p === "/landing-oficial" ||
        p.startsWith("/landingpage_tfm") ||
        p.startsWith("/landingpage-tfm")
      ) {
        setVerLogin(false);
      }
    };
    window.addEventListener("popstate", alVolver);
    return () => window.removeEventListener("popstate", alVolver);
  }, []);

  const entrarDesdeLanding = React.useCallback(() => {
    if (isLoggedIn) {
      window.history.pushState({}, "", "/");
      setRutaActual("/");
      setVerLogin(false);
    } else {
      window.history.pushState({}, "", "/login");
      setRutaActual("/login");
      setVerLogin(true);
    }
  }, [isLoggedIn]);

  const volverALanding = React.useCallback(() => {
    window.history.pushState({}, "", "/landing");
    setRutaActual("/landing");
    setVerLogin(false);
  }, []);

  return { isMusicianRoute, isEpkRoute, isDealRoute, isFanRoute, isTfmRoute, verLogin, entrarDesdeLanding, isDirectLandingRoute, volverALanding };
}
