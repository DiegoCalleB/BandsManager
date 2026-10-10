/**
 * Estado de los ajustes visuales de la hoja (columnas, letra, badges, marca de agua…).
 * Extraído de PdfExportModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { SetlistStylePreset } from "../printLayout";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface PrintSettingsParams {
  bandLogoUrl: string;
}

/**
 * Estado de los ajustes visuales de la hoja (columnas, letra, badges, marca de agua…).
 * @param params Estado y callbacks del contenedor ({@link PrintSettingsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function usePrintSettings({ bandLogoUrl }: PrintSettingsParams) {
  // Ajustes avanzados (letra manuscrita, tinta, badges de tonalidad/BPM/duración) van ocultos
  // detrás de este toggle SOLO en móvil (ver"sm:flex" más abajo, que los fuerza siempre visibles
  // en pantallas grandes) — en pantallas pequeñas todo junto agobiaba, tapando la vista previa.
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Columnas por hoja: con sets largos en pocas hojas, dos columnas permiten una letra bastante
  // mayor que una sola columna apretada (cada columna se llena de arriba abajo, en orden).
  const [columnsChoice, setColumnsChoice] = useState<"auto" | 1 | 2>("auto");

  // Design & Preset State
  const [stylePreset] =
    useState<SetlistStylePreset>("rock_stage");

  // El tamaño real de impresión ya no se elige a mano: se auto-ajusta por hoja (ver
  // setlistPaginator.ts, usado en buildPrintDocument). La vista previa en pantalla no
  // reproduce esa paginación 1:1 (no hay salto de página visible aquí, solo scroll), así que usa
  // un tamaño de referencia fijo — PREVIEW_TITLE_FONT_PT, más abajo.
  const [handwritingFont, setHandwritingFont] = useState<
    "caveat" | "permanent_marker" | "courier" | "sans"
  >("caveat");

  const [handwritingColor, setHandwritingColor] = useState<
    "blue" | "black" | "red" | "purple"
  >("blue");

  // Customization Toggles (Duration and BPM OFF by default as requested)
  const [showBandLogo, setShowBandLogo] = useState<boolean>(true);

  // customLogoUrl usaba a ser un useState propio inicializado con bandLogoUrl — pero nada más lo
  // reasignaba, así que solo copiaba el prop una vez en el primer render y se quedaba pegado en
  // vacío si el modal se montaba antes de que epkConfig.logoUrl terminara de cargar (fetch
  // asíncrono en el componente padre), aunque el prop se actualizara después con la URL real del
  // logo ya subido. Al no haber ningún uploader propio que lo reasigne, es un simple alias del
  // prop — usarlo directamente evita ese desajuste sin necesitar sincronizarlo a mano.
  const customLogoUrl = bandLogoUrl;

  const [showSongNumbers] = useState<boolean>(true);

  const [showTonality, setShowTonality] = useState<boolean>(true);

  const [showBpm, setShowBpm] = useState<boolean>(true);

  const [showDuration, setShowDuration] = useState<boolean>(false);

  // Tono/BPM en todos los temas o solo en los que cada músico marca (los que le generan dudas).
  const [badgesScope, setBadgesScope] = useState<"all" | "marked">("marked");

  const [markedSongs, setMarkedSongs] = useState<Record<string, string[]>>({});

  const [showMarksPanel, setShowMarksPanel] = useState(false);

  const [showSetlistNotes] = useState<boolean>(true);

  // Notas generales de la canción (las del repertorio, no las del bolo ni las de cada músico).
  const [showGeneralNotes, setShowGeneralNotes] = useState<boolean>(true);

  const [showAppBranding, setShowAppBranding] = useState<boolean>(true);

  // Alineación del repertorio: "left" (clásico) o "center" (título, número y notas centrados en
  // la hoja, como muchos grupos montan el setlist del escenario). En centrado las notas van
  // siempre en su línea debajo del título (ver forceBelowMode) y sin flecha, que apuntaría a la
  // izquierda en el vacío.
  const [textAlign, setTextAlign] = useState<"left" | "center">("left");

  const isCentered = textAlign === "center";

  // Marca de agua: el logo del grupo, muy suave y detrás del repertorio. Va en gris y con
  // `multiply` para que se funda con el papel; si un logo con fondo oscuro marca su caja, se
  // apaga con el checkbox.
  const [showWatermark, setShowWatermark] = useState<boolean>(true);

  return { markedSongs, setMarkedSongs, textAlign, columnsChoice, showGeneralNotes, showTonality, showBpm, showDuration, showBandLogo, showWatermark, showAppBranding, handwritingFont, handwritingColor, badgesScope, setTextAlign, setColumnsChoice, setShowGeneralNotes, setShowTonality, setShowBpm, setShowDuration, setShowBandLogo, setShowWatermark, setShowAppBranding, setHandwritingFont, setHandwritingColor, setBadgesScope, showSongNumbers, showSetlistNotes, stylePreset, customLogoUrl, isCentered, setShowAdvancedSettings, showAdvancedSettings, setShowMarksPanel, showMarksPanel };
}
