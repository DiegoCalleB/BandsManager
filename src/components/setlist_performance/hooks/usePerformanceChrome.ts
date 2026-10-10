/**
 * Estado de la interfaz: modo, paneles, tamaño de letra, brillo, descanso y pantalla completa.
 * Extraído de SetlistPerformanceView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useRef,useState } from "react";
import { useFullscreen } from "../../../hooks/useFullscreen";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface PerformanceChromeParams {
  initialMode: "directo" | "ensayo";
}

/**
 * Estado de la interfaz: modo, paneles, tamaño de letra, brillo, descanso y pantalla completa.
 * @param params Estado y callbacks del contenedor ({@link PerformanceChromeParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function usePerformanceChrome({ initialMode }: PerformanceChromeParams) {
  const [modeArchetype, setModeArchetype] = useState<"directo" | "ensayo">(
    initialMode,
  );

  const [showSongListDrawer, setShowSongListDrawer] = useState(false);

  const [fontSizeIdx, setFontSizeIdx] = useState(1);

  const [showNotes, setShowNotes] = useState(false);

  const [showDetails, setShowDetails] = useState(false);

  // Un navegador no puede subir el brillo real de la pantalla (no existe esa API por
  // privacidad/seguridad) — esto es lo más parecido que se puede ofrecer: fondo blanco con
  // texto negro muy grueso, que en la práctica se ve mucho mejor que ámbar-sobre-negro bajo sol
  // directo o focos de escenario (y suele disparar el brillo automático del propio móvil).
  const [glareMode, setGlareMode] = useState(false);

  //"Apagar" la pantalla no es algo que una web pueda hacer de verdad (no hay API para eso) —
  // esto es lo más parecido y honesto: soltar el Wake Lock (deja que el móvil se apague solo
  // por su propio temporizador de inactividad) y pintar negro puro, que en la mayoría de
  // pantallas OLED apaga esos píxeles de verdad y sí ahorra batería real. Se resetea en cada
  // cambio de canción a propósito: activarlo es una decisión por tema, no"para siempre",
  // para no arriesgarse a llegar a la siguiente canción sin pantalla por olvido.
  const [isResting, setIsResting] = useState(false);

  const [showFlightModeInfo, setShowFlightModeInfo] = useState(false);

  // Menú"más opciones": agrupa todo lo que no hace falta ver siempre (brillo, descanso, modo
  // avión, notas, vista, tamaño de letra, pantalla completa) para que el header no vuelva a
  // llenarse de iconos y comerse el título de la canción.
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Pantalla completa real del navegador: oculta la barra de Chrome/Safari y evita toques accidentales.
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);

  return { toggleFullscreen, setShowDetails, setIsResting, setShowMoreMenu, setShowFlightModeInfo, isResting, containerRef, glareMode, setModeArchetype, modeArchetype, setShowSongListDrawer, showMoreMenu, setGlareMode, setShowNotes, showNotes, setFontSizeIdx, isFullscreen, showFlightModeInfo, fontSizeIdx, showDetails, showSongListDrawer };
}
