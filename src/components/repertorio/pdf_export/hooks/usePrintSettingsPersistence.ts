/**
 * Carga y guarda en el servidor los ajustes de impresión del setlist activo.
 * Extraído de PdfExportModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { apiFetch } from "../../../../utils/api";
import { PrintSettings, mergePrintSettings } from "../../../../utils/printSettings";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface PrintSettingsPersistenceParams {
  textAlign: "left" | "center";
  columnsChoice: 2 | "auto" | 1;
  showGeneralNotes: boolean;
  showTonality: boolean;
  showBpm: boolean;
  showDuration: boolean;
  showBandLogo: boolean;
  showWatermark: boolean;
  showAppBranding: boolean;
  handwritingFont: "caveat" | "permanent_marker" | "courier" | "sans";
  handwritingColor: "blue" | "black" | "red" | "purple";
  badgesScope: "all" | "marked";
  markedSongs: Record<string, string[]>;
  setTextAlign: Dispatch<SetStateAction<"left" | "center">>;
  setColumnsChoice: Dispatch<SetStateAction<2 | "auto" | 1>>;
  setShowGeneralNotes: Dispatch<SetStateAction<boolean>>;
  setShowTonality: Dispatch<SetStateAction<boolean>>;
  setShowBpm: Dispatch<SetStateAction<boolean>>;
  setShowDuration: Dispatch<SetStateAction<boolean>>;
  setShowBandLogo: Dispatch<SetStateAction<boolean>>;
  setShowWatermark: Dispatch<SetStateAction<boolean>>;
  setShowAppBranding: Dispatch<SetStateAction<boolean>>;
  setHandwritingFont: Dispatch<SetStateAction<"caveat" | "permanent_marker" | "courier" | "sans">>;
  setHandwritingColor: Dispatch<SetStateAction<"blue" | "black" | "red" | "purple">>;
  setBadgesScope: Dispatch<SetStateAction<"all" | "marked">>;
  setMarkedSongs: Dispatch<SetStateAction<Record<string, string[]>>>;
}

/**
 * Carga y guarda en el servidor los ajustes de impresión del setlist activo.
 * @param params Estado y callbacks del contenedor ({@link PrintSettingsPersistenceParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function usePrintSettingsPersistence({ textAlign, columnsChoice, showGeneralNotes, showTonality, showBpm, showDuration, showBandLogo, showWatermark, showAppBranding, handwritingFont, handwritingColor, badgesScope, markedSongs, setTextAlign, setColumnsChoice, setShowGeneralNotes, setShowTonality, setShowBpm, setShowDuration, setShowBandLogo, setShowWatermark, setShowAppBranding, setHandwritingFont, setHandwritingColor, setBadgesScope, setMarkedSongs }: PrintSettingsPersistenceParams) {
  // Ajustes que se recuerdan POR BANDA (tabla band_print_settings, ver printSettings.ts): se cargan
  // al abrir el modal y se guardan, con debounce, cuando cambian. Las claves van en el mismo orden
  // que DEFAULT_PRINT_SETTINGS para que la comparación por JSON no dé falsos cambios.
  const currentPrintSettings: PrintSettings = {
    textAlign,
    columnsChoice,
    showGeneralNotes,
    showTonality,
    showBpm,
    showDuration,
    showBandLogo,
    showWatermark,
    showAppBranding,
    handwritingFont,
    handwritingColor,
    badgesScope,
    markedSongs,
  };

  const printSettingsKey = JSON.stringify(currentPrintSettings);

  // "off": no hay base de datos (desarrollo local) o falló la carga: se usa sin recordar nada.
  const [persist, setPersist] = useState<"loading" | "on" | "off">("loading");

  const [saveFailed, setSaveFailed] = useState(false);

  const lastSavedRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ settings: PrintSettings | null }>("/api/bands/print-settings")
      .then((r) => {
        if (cancelled) return;
        if (!r?.settings) {
          setPersist("off");
          return;
        }
        const s = mergePrintSettings(r.settings);
        setTextAlign(s.textAlign);
        setColumnsChoice(s.columnsChoice);
        setShowGeneralNotes(s.showGeneralNotes);
        setShowTonality(s.showTonality);
        setShowBpm(s.showBpm);
        setShowDuration(s.showDuration);
        setShowBandLogo(s.showBandLogo);
        setShowWatermark(s.showWatermark);
        setShowAppBranding(s.showAppBranding);
        setHandwritingFont(s.handwritingFont);
        setHandwritingColor(s.handwritingColor);
        setBadgesScope(s.badgesScope);
        setMarkedSongs(s.markedSongs);
        lastSavedRef.current = JSON.stringify(s);
        setPersist("on");
      })
      .catch(() => {
        if (!cancelled) setPersist("off");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (persist !== "on" || printSettingsKey === lastSavedRef.current) return;
    const timer = setTimeout(async () => {
      try {
        const r = await apiFetch<{ success: boolean }>("/api/bands/print-settings", {
          method: "PUT",
          body: printSettingsKey,
        });
        if (r?.success) {
          lastSavedRef.current = printSettingsKey;
          setSaveFailed(false);
        } else {
          setSaveFailed(true);
        }
      } catch {
        setSaveFailed(true);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [persist, printSettingsKey]);

  return { saveFailed };
}
