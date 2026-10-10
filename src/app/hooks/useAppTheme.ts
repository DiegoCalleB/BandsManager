/**
 * Tema, tipografía y colores de la aplicación.
 * Extraído de App.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ useEffect,useState } from "react";
import { api } from "../../services/api";
import type { User } from "../../types";
import { ThemeColors,ThemeName } from "../../types";
import { THEMES,getEspectroColors } from "../../utils/theme";
import { FontPresetKey,applyFontPreset,getStoredFontPreset } from "../../utils/typography";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface AppThemeParams {
  currentUser: User;
  refreshSession: () => Promise<void>;
  fetchState: (retryCount?: number) => Promise<void>;
}

/**
 * Tema, tipografía y colores de la aplicación.
 * @param params Estado y callbacks del contenedor ({@link AppThemeParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useAppTheme({ currentUser, refreshSession, fetchState }: AppThemeParams) {
  // Active Theme State
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    const saved = localStorage.getItem("bandmanager_theme") as ThemeName;
    // Un tema guardado que ya no existe (p. ej. las paletas analog/legato/spectrum que llegaron a
    // estar en main) cae al por defecto en vez de dejar `colors` sin definir.
    if (!saved || (saved as string) === "stitch_light" || !(saved in THEMES)) {
      return "indie_velvet";
    }
    return saved;
  });

  // Active Font State
  const [currentFont, setCurrentFont] =
    useState<FontPresetKey>(getStoredFontPreset);

  const [showFontModal, setShowFontModal] = useState(false);

  useEffect(() => {
    applyFontPreset(currentFont);
  }, [currentFont]);

  const handleFontChange = (newFont: FontPresetKey) => {
    setCurrentFont(newFont);
    applyFontPreset(newFont);
  };

  // Handle Stripe Payment Redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");
    const planParam = urlParams.get("plan");
    const bandParam = urlParams.get("band");
    const sessionParam = urlParams.get("session_id");

    if (paymentStatus === "success") {
      const planName = planParam
        ? planParam.toUpperCase().replace("_", " ")
        : "PRO";

      // Clean URL params immediately
      window.history.replaceState({}, document.title, window.location.pathname);

      // Confirm to backend and update Supabase & memory state
      const targetBand = bandParam || currentUser?.band_id;

      if (sessionParam) {
        api
          .confirmPaymentSuccess({
            sessionId: sessionParam,
            bandId: targetBand,
          })
          .then(() => {
            refreshSession();
            fetchState();
          })
          .catch((err) => {
            console.warn("Error confirming payment with backend:", err);
            refreshSession();
            fetchState();
          });
      } else {
        refreshSession();
        fetchState();
      }

      alert(
        `🎉 ¡Suscripción completada con éxito! Tu banda ahora cuenta con el Plan ${planName} activado.`,
      );
    } else if (paymentStatus === "cancelled") {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Detecta cambios en data-theme para sincronizar colores Espectro
  const [dataTheme, setDataTheme] = React.useState<string>(() => {
    if (typeof document === "undefined") return "classic";
    return document.documentElement.getAttribute("data-theme") || "classic";
  });

  useEffect(() => {
    // Observa cambios en el atributo data-theme
    const observer = new MutationObserver(() => {
      const newTheme =
        document.documentElement.getAttribute("data-theme") || "classic";
      setDataTheme(newTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const isEspectroActive = dataTheme === "light" || dataTheme === "dark";

  // Proporciona colores del sistema Espectro o fallback al sistema antiguo
  const colors: ThemeColors = isEspectroActive
    ? getEspectroColors()
    : THEMES[currentTheme] || THEMES.indie_velvet;

  // Espectro resuelve claro/oscuro en tokens: las ramas `isStitchLight` heredadas (slate/indigo)
  // que aún quedan en componentes no deben activarse nunca. Se mantiene el nombre porque el código
  // que llega de main lo pasa como prop.

  // Persist Theme Selection - sincroniza tanto currentTheme como data-theme
  const handleThemeChange = (theme: ThemeName) => {
    setCurrentTheme(theme);
    localStorage.setItem("bandmanager_theme", theme);
    // Actualiza data-theme para que Espectro sepa qué tema usar
    const resolvedTheme = theme === "classic" ? "classic" : "light";
    document.documentElement.setAttribute("data-theme", resolvedTheme);
  };

  return { colors, currentTheme, handleThemeChange, currentFont, handleFontChange, showFontModal, setShowFontModal };
}
