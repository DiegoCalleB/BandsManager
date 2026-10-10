/**
 * Estado base del Atril: pestañas, notación, transposición, cifrado, paneles y pantalla completa.
 * Extraído de Atril.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
 
import { useEffect,useMemo,useRef,useState } from "react";
import { useAutoScroll } from "../../../hooks/useAutoScroll";
import { useMetronomo } from "../../../hooks/useMetronomo";
import { AnalisisAcordes,Song,SongSubstituteGuide } from "../../../types";
import { ajustesDeModoAtril,ModoAtril } from "../../../utils/modosAtril";
import { useVistaAcordes } from "../../chords/AcordeEnInstrumento";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface AtrilStateParams {
  modo: ModoAtril;
  song: Song;
}

/**
 * Estado base del Atril: pestañas, notación, transposición, cifrado, paneles y pantalla completa.
 * @param params Estado y callbacks del contenedor ({@link AtrilStateParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useAtrilState({ modo, song }: AtrilStateParams) {
  const ajustes = useMemo(
    () => ajustesDeModoAtril(modo, typeof window === "undefined" ? 1024 : window.innerWidth),
    [modo],
  );
  const [activeTab, setActiveTab] = useState<"chords" | "substitute" | "armonia" | "edit">(
    "chords",
  );
  const [notation, setNotation] = useState<"ES" | "EN">("ES");
  const [transpose, setTranspose] = useState<number>(0);

  // Auto-scroll state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScroll = useAutoScroll(scrollContainerRef, 2);
  const metronomo = useMetronomo(song.bpm || 120);

  // Show Chord Diagrams drawer/panel
  const [vistaAcordes, setVistaAcordes] = useVistaAcordes();
  const [showChordDiagrams, setShowChordDiagrams] = useState<boolean>(ajustes.diagramas);

  // Edit form state
  const [cifradoTexto, setCifradoTexto] = useState<string>(
    song.cifradoTexto || "",
  );
  const [guiaSustituto, setGuiaSustituto] = useState<SongSubstituteGuide>(
    song.guiaSustituto || {},
  );

  // Análisis de acordes del audio (detección propia, sin IA generativa)
  const [isAnalyzingChords, setIsAnalyzingChords] = useState<boolean>(false);
  const [showAnalisisAcordes, setShowAnalisisAcordes] = useState<boolean>(true);
  const analisisAcordes: AnalisisAcordes | undefined = song.analisisAcordes;
  const [seguirEnCifrado, setSeguirEnCifrado] = useState<boolean>(true);


  // AI Generation loading state
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [oidoOculto, setOidoOculto] = useState<boolean>(!ajustes.oido);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  // Pantalla completa: la hoja ocupa todo el viewport y, si el navegador deja, esconde su barra.
  const [pantallaCompleta, setPantallaCompleta] = useState<boolean>(false);
  const alternarPantallaCompleta = () => {
    const entrar = !pantallaCompleta;
    setPantallaCompleta(entrar);
    try {
      if (entrar) void document.documentElement.requestFullscreen?.().catch(() => {});
      else if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    } catch {
      /* sin Fullscreen API (iOS Safari): basta con la hoja a viewport completo */
    }
  };
  useEffect(() => {
    // Esc del navegador sale de pantalla completa: la hoja vuelve al tamaño de modal.
    const alCambiar = () => { if (!document.fullscreenElement) setPantallaCompleta(false); };
    document.addEventListener("fullscreenchange", alCambiar);
    return () => {
      document.removeEventListener("fullscreenchange", alCambiar);
      try { if (document.fullscreenElement) void document.exitFullscreen().catch(() => {}); } catch { /* nada */ }
    };
  }, []);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showMetronomeModal, setShowMetronomeModal] = useState<boolean>(false);
  const [showTunerModal, setShowTunerModal] = useState<boolean>(false);
  const [showStructureUploadModal, setShowStructureUploadModal] =
    useState<boolean>(false);

  return { ajustes, transpose, setAiSuccessMsg, setCifradoTexto, setGuiaSustituto, setIsAnalyzingChords, setOidoOculto, setShowAnalisisAcordes, analisisAcordes, isAnalyzingChords, setIsGeneratingAi, cifradoTexto, guiaSustituto, setActiveTab, notation, seguirEnCifrado, showAnalisisAcordes, scrollContainerRef, activeTab, autoScroll, setCopiedText, pantallaCompleta, alternarPantallaCompleta, isGeneratingAi, setShowStructureUploadModal, setShowShareModal, setShowMetronomeModal, setShowTunerModal, setTranspose, metronomo, setNotation, showChordDiagrams, setShowChordDiagrams, copiedText, aiSuccessMsg, setSeguirEnCifrado, vistaAcordes, setVistaAcordes, showShareModal, showMetronomeModal, showTunerModal, oidoOculto, showStructureUploadModal };
}
