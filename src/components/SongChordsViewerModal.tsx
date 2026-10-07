import React, { useState, useEffect, useRef, useMemo } from "react";
import { guardarOReverter } from "../utils/guardarConReversion";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Edit3,
  Save,
  Printer,
  Music2,
  Music,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileText,
  UserCheck,
  Zap,
  Info,
  Wand2,
  Copy,
  Check,
  ListMusic,
  Share2,
  MessageSquare,
  Upload,
  GraduationCap,
} from "lucide-react";
import { Song, SongSubstituteGuide, AnalisisAcordes } from "../types";
import { formatSongTitle } from "../utils/formatSongTitle";
import { ShareModal } from "./ShareModal";
import { LineaTiempoAcordes } from "./chords/LineaTiempoAcordes";
import { RelojEnAcorde } from "./chords/RelojEnAcorde";
import { SelectorArmonia } from "./chords/SelectorArmonia";
import { PanelArmonia } from "./chords/PanelArmonia";
import { ProfesorIA } from "./chords/ProfesorIA";
import { contextoDeAcordes, ordenarPorTonica } from "../utils/vistaAcordes";
import { normalizarAcorde } from "../utils/lineaTiempoAcordes";
import { CajaAcorde, SelectorVistaAcorde, useVistaAcordes } from "./chords/AcordeEnInstrumento";
import { analizarArmonia, explicarAcorde, nombreDeNota, usaBemoles, NOMBRE_FUNCION, type AnalisisArmonico, type Funcion } from "../utils/teoriaArmonica";
import { infoDeAcordeVisible } from "../utils/armoniaVisor";
import { CLASE_FUNCION, leerEstiloArmonia, guardarEstiloArmonia, textoDeAcorde, gradoVisible, type EstiloArmonia } from "../utils/estiloArmonia";
import { alinearCifradoConAudio, tiemposDeAcordes, acordeActivoPorTiempo, lineaDeCadaAcorde, acordesDelCifrado, esLineaCabecera, esTokenAcorde, asociarLineasConLetra, Alineacion } from "../utils/alineacionAcordes";
import { indiceSegmentoEn } from "../utils/lineaTiempoAcordes";
import { ModalPortal } from "./common/ModalPortal";
import { apiFetch } from "../utils/api";
import { ModalOido } from "./chords/ModalOido";
import { SelectorEscucha } from "./chords/SelectorEscucha";
import { useMezclaStems } from "../hooks/useMezclaStems";
import { getSongIrisStemIdea, getIdeaTracks } from "../utils/irisTracks";
import { pistaDelUsuario, pistasParaModo, type ModoEscucha } from "../utils/mezclaStems";
import { instrumentoDelUsuario } from "../utils/instrumentoProfesor";
import { formatSongShareText } from "../utils/shareUtils";
import { SongStudioStructureUploadModal } from "./song_studio/SongStudioStructureUploadModal";
import {
  processChordText,
  extractUniqueChords,
  transposeChordToken,
  parseRootNote,
} from "../utils/chordUtils";
import { ShowIcon } from './ui/ShowIcon';
import { Button, IconButton, Input, LinkButton, Textarea } from './ui';

interface SongChordsViewerModalProps {
  song: Song;
  onClose: () => void;
  onUpdateSong: (updated: Song) => void;
}

export function SongChordsViewerModal({
  song,
  onClose,
  onUpdateSong,
}: SongChordsViewerModalProps) {
  const [activeTab, setActiveTab] = useState<"chords" | "substitute" | "armonia" | "edit">(
    "chords",
  );
  const [notation, setNotation] = useState<"ES" | "EN">("ES");
  const [transpose, setTranspose] = useState<number>(0);

  // Auto-scroll state
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(2); // 1 = slow, 3 = fast
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Show Chord Diagrams drawer/panel
  const [vistaAcordes, setVistaAcordes] = useVistaAcordes();
  const [showChordDiagrams, setShowChordDiagrams] = useState<boolean>(() => typeof window === "undefined" || window.innerWidth >= 768);

  // Edit form state
  const [cifradoTexto, setCifradoTexto] = useState<string>(
    song.cifradoTexto || "",
  );
  const [guiaSustituto, setGuiaSustituto] = useState<SongSubstituteGuide>(
    song.guiaSustituto || {},
  );

  // Análisis de acordes del audio (detección propia, sin IA generativa)
  const [isAnalyzingChords, setIsAnalyzingChords] = useState<boolean>(false);
  const [showAnalisisAcordes, setShowAnalisisAcordes] = useState<boolean>(false);
  const analisisAcordes: AnalisisAcordes | undefined = song.analisisAcordes;
  const [seguirEnCifrado, setSeguirEnCifrado] = useState<boolean>(true);
  // Aviso de una sola vez: la detección de acordes del audio no se descubría sola.
  const [avisoAcordesVisto, setAvisoAcordesVisto] = useState<boolean>(() => {
    try {
      return localStorage.getItem("bm_aviso_acordes_audio") === "1";
    } catch {
      return false;
    }
  });
  const cerrarAvisoAcordes = () => {
    setAvisoAcordesVisto(true);
    try {
      localStorage.setItem("bm_aviso_acordes_audio", "1");
    } catch {
      /* sin almacenamiento: el aviso volverá a salir, no pasa nada */
    }
  };

  // AI Generation loading state
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [oidoOculto, setOidoOculto] = useState<boolean>(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showStructureUploadModal, setShowStructureUploadModal] =
    useState<boolean>(false);

  // Audio playback state
  const audioUrl =
    song.audioPrincipalUrl ||
    song.audioUrl ||
    (song.audioIdeas && song.audioIdeas.length > 0
      ? song.audioIdeas[0].audioUrl
      : "");
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  // Stems de Iris: escuchar todo, solo mi pista o todo menos mi pista
  const stems = useMemo(() => {
    const idea = getSongIrisStemIdea(song);
    return idea ? getIdeaTracks(idea) : [];
  }, [song]);
  const [modoEscucha, setModoEscucha] = useState<ModoEscucha>("todo");
  const [miPistaId, setMiPistaId] = useState<string | null>(null);
  const miId = miPistaId && stems.some((p) => p.id === miPistaId) ? miPistaId : (pistaDelUsuario(stems, instrumentoDelUsuario())?.id ?? null);
  const pistasSonando = useMemo(() => pistasParaModo(stems, miId, modoEscucha), [stems, miId, modoEscucha]);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(
    song.duracionSegundos || 0,
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useMezclaStems(audioRef, pistasSonando, audioUrl);

  // Sync audio duration and cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleToggleAudio = () => {
    if (!audioUrl) {
      setAiSuccessMsg(
        "⚠️ Esta canción aún no tiene un archivo de audio o maqueta adjunto en el Repertorio.",
      );
      setTimeout(() => setAiSuccessMsg(null), 4000);
      return;
    }

    if (!audioRef.current) return;

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlayingAudio(true);
        })
        .catch((err) => {
          console.error("Error al reproducir audio:", err);
          setIsPlayingAudio(false);
          setAiSuccessMsg("⚠️ No se pudo reproducir el audio del tema.");
          setTimeout(() => setAiSuccessMsg(null), 4000);
        });
    }
  };

  const handleSeekAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setAudioCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleRestartAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setAudioCurrentTime(0);
      if (!isPlayingAudio) {
        audioRef.current
          .play()
          .then(() => setIsPlayingAudio(true))
          .catch(() => {});
      }
    }
  };

  const formatAudioTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // El estado de edición solo se inicializa desde `song` al montar (useState no vuelve a leer
  // sus argumentos). Cuando la subida de estructura o la generación con IA actualizan `song`
  // desde fuera del formulario de edición, había que cerrar y reabrir el modal para verlo:
  // este efecto sincroniza el estado local en cuanto cambian los valores reales de la canción.
  useEffect(() => {
    setCifradoTexto(song.cifradoTexto || "");
    setGuiaSustituto(song.guiaSustituto || {});
  }, [song.cifradoTexto, song.guiaSustituto]);

  // Auto-scroll timer effect
  useEffect(() => {
    let interval: any = null;
    if (isAutoScrolling) {
      interval = setInterval(() => {
        if (scrollContainerRef.current) {
          const { scrollTop, scrollHeight, clientHeight } =
            scrollContainerRef.current;
          if (scrollTop + clientHeight >= scrollHeight - 5) {
            setIsAutoScrolling(false);
          } else {
            scrollContainerRef.current.scrollTop += scrollSpeed * 0.8;
          }
        }
      }, 50);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isAutoScrolling, scrollSpeed]);

  // Detecta los acordes con tiempos directamente del audio (cálculo local, ~1 s, sin coste de IA).
  const handleAnalyzeChordsFromAudio = async (sobrescribir = false) => {
    try {
      setIsAnalyzingChords(true);
      setOidoOculto(false);
      setAiSuccessMsg(null);
      const data = await apiFetch<any>(`/api/songs/${encodeURIComponent(song.id)}/analizar-acordes`, {
        method: "POST",
        body: JSON.stringify({ sobrescribir }),
      });
      if (!data?.analisis) throw new Error(data?.error || "No se pudieron analizar los acordes");
      onUpdateSong({ ...song, analisisAcordes: data.analisis });
      setShowAnalisisAcordes(true);
      const dudosos = data.analisis.segmentos.filter((s: any) => s.acorde === "N").length;
      setAiSuccessMsg(
        dudosos > 0
          ? `⚠️ Acordes detectados del audio (${data.analisis.segmentos.length} tramos, ${dudosos} sin acorde claro). Es una detección automática: revísala de oído.`
          : `✓ Acordes detectados del audio (${data.analisis.segmentos.length} tramos). Es una detección automática: revísala de oído.`,
      );
    } catch (err: any) {
      setAiSuccessMsg(`⚠️ ${err.message || "No se pudieron analizar los acordes del audio"}`);
    } finally {
      setIsAnalyzingChords(false);
      setTimeout(() => setAiSuccessMsg(null), 7000);
    }
  };

  // Corrección manual de los acordes detectados: se refleja al instante y se revierte si el
  // servidor la rechaza, para que lo que se ve sea lo que hay guardado.
  // Pide la explicación del profesor al servidor (que valida y guarda) y la refleja en la canción.
  const pedirProfesor = async (opciones: { nivel: string; instrumento: string; forzar: boolean }) => {
    const data = await apiFetch<any>(`/api/songs/${encodeURIComponent(song.id)}/profesor-armonia`, {
      method: "POST",
      body: JSON.stringify(opciones),
    });
    if (!data?.profesor) throw new Error("El servidor no devolvió ninguna explicación.");
    if (analisisAcordes) onUpdateSong({ ...song, analisisAcordes: { ...analisisAcordes, profesor: data.profesor } });
    return data.profesor;
  };

  const handleCorregirAcordes = (segmentos: AnalisisAcordes["segmentos"]) => {
    if (!analisisAcordes) return;
    const anterior = song;
    onUpdateSong({ ...song, analisisAcordes: { ...analisisAcordes, segmentos } });
    const token = localStorage.getItem("bakandeya_token") || localStorage.getItem("token") || "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      headers["x-auth-token"] = token;
    }
    guardarOReverter(
      fetch(`/api/songs/${encodeURIComponent(song.id)}/acordes`, { method: "PATCH", headers, body: JSON.stringify({ segmentos }) }),
      () => {
        onUpdateSong(anterior);
        setAiSuccessMsg("⚠️ No se pudo guardar la corrección del acorde. Se ha restaurado el anterior.");
        setTimeout(() => setAiSuccessMsg(null), 6000);
      },
    );
  };

  // Handle AI chord generation
  const handleGenerateWithAi = async () => {
    try {
      setIsGeneratingAi(true);
      setOidoOculto(false);
      setAiSuccessMsg(null);

      // Un cifrado que ya existe (escrito por la banda) no se sustituye sin preguntar.
      const sobrescribir = Boolean(song.cifradoTexto && song.cifradoTexto.trim());
      if (sobrescribir && !window.confirm("Esta canción ya tiene un cifrado guardado. Si lo transcribes desde el audio, el actual se sustituirá. ¿Continuar?")) {
        setIsGeneratingAi(false);
        return;
      }

      // Letra con un modelo de reconocimiento de voz (con tiempos) y acordes detectados del audio,
      // fusionados por tiempo. Nada se genera a partir del título.
      const data = await apiFetch<any>(`/api/songs/${encodeURIComponent(song.id)}/letra-sincronizada`, {
        method: "POST",
        body: JSON.stringify({ sobrescribir }),
      });

      if (!data?.success || !data.cifradoTexto) {
        throw new Error(data?.error || "No se pudo transcribir la letra del audio");
      }

      setCifradoTexto(data.cifradoTexto);
      onUpdateSong({
        ...song,
        cifradoTexto: data.cifradoTexto,
        guiaSustituto: data.song?.guiaSustituto ?? song.guiaSustituto,
        ...(data.analisis ? { analisisAcordes: data.analisis } : {}),
      });
      if (data.analisis) setShowAnalisisAcordes(true);

      // El mensaje dice de dónde sale la letra y cuánto fiarse: nadie debe dar por buena una
      // transcripción automática sin revisarla de oído.
      const partes: string[] = [`${data.lineas} líneas transcritas${data.idioma ? ` (idioma detectado: ${data.idioma})` : ""}`];
      partes.push(data.conAcordes ? "acordes sincronizados por tiempo" : "sin acordes (no se pudieron detectar)");
      if (data.fuenteLetra === "mezcla") {
        setAiSuccessMsg(
          `⚠️ ${partes.join(", ")}. No hay pista de voz aislada: se transcribió la mezcla completa y habrá errores. Separa la voz con Iris para mejorarlo. Revísala de oído.`,
        );
      } else {
        setAiSuccessMsg(`✓ Letra transcrita de la voz: ${partes.join(", ")}. Es automática: revísala de oído.`);
      }
      setTimeout(() => setAiSuccessMsg(null), 9000);
    } catch (err: any) {
      console.error("Error generating with AI:", err);
      setAiSuccessMsg(`⚠️ ${err.message || "No se pudo transcribir la letra"}`);
      setTimeout(() => setAiSuccessMsg(null), 12000);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Save manual edit changes
  const handleSaveEdits = () => {
    const updatedSong: Song = {
      ...song,
      cifradoTexto,
      guiaSustituto,
    };

    // Save to server
    const token =
      localStorage.getItem("bakandeya_token") ||
      localStorage.getItem("token") ||
      "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      headers["x-auth-token"] = token;
    }

    // El aviso de éxito solo sale si el servidor aceptó el cambio; si no, se deja la canción como
    // estaba (antes decía «guardados con éxito» aunque el PUT hubiera fallado y se perdía al refrescar).
    onUpdateSong(updatedSong);
    setActiveTab("chords");
    guardarOReverter(
      fetch(`/api/songs/${song.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updatedSong),
      }),
      () => {
        onUpdateSong(song);
        setAiSuccessMsg("⚠️ No se pudieron guardar los cambios de los acordes. Se ha restaurado la versión anterior.");
        setTimeout(() => setAiSuccessMsg(null), 6000);
      },
    ).then((guardado) => {
      if (!guardado) return;
      setAiSuccessMsg("¡Cambios guardados con éxito!");
      setTimeout(() => setAiSuccessMsg(null), 3000);
    });
  };

  // Process text according to current transpose and notation
  const processedText = processChordText(cifradoTexto, transpose, notation);

  // Fusión cifrado ↔ audio: cada acorde del texto hereda el tiempo del tramo detectado con el que
  // casa. Se calcula sobre el texto SIN transponer (la transposición es solo de pantalla).
  const alineacion = useMemo<Alineacion | null>(
    () => (analisisAcordes ? alinearCifradoConAudio(cifradoTexto, analisisAcordes.segmentos) : null),
    [cifradoTexto, analisisAcordes],
  );
  const sincronizado = Boolean(alineacion?.usable && seguirEnCifrado && showAnalisisAcordes);

  // Letra con tiempos (Whisper): cada línea del cifrado sabe cuándo suena y la actual se resalta.
  const letraTranscrita = analisisAcordes?.letra?.lineas;
  const lineasConLetra = useMemo(
    () => (letraTranscrita && letraTranscrita.length > 0 ? asociarLineasConLetra(cifradoTexto, letraTranscrita) : null),
    [cifradoTexto, letraTranscrita],
  );

  // Instante de CADA acorde del cifrado. Los que no casan con un cambio del audio (el acorde que se repite
  // al empezar una frase) toman el inicio de su frase: sin esto el resaltado se saltaba esos acordes.
  const tiemposAcordes = useMemo(() => {
    if (!alineacion || !analisisAcordes) return [];
    const lineas = lineaDeCadaAcorde(cifradoTexto);
    const porLinea = lineas.map((l) => {
      const k = lineasConLetra?.[l];
      return k !== null && k !== undefined && letraTranscrita?.[k] ? letraTranscrita[k].t0 : null;
    });
    return tiemposDeAcordes(alineacion, analisisAcordes.segmentos, porLinea);
  }, [alineacion, analisisAcordes, cifradoTexto, lineasConLetra, letraTranscrita]);
  const acordeActivo = sincronizado ? acordeActivoPorTiempo(tiemposAcordes, audioCurrentTime) : -1;

  // El acorde que suena ahora, tal como se ve (transpuesto): ilumina su diagrama en el cajón.
  const acordeSonando = useMemo(() => {
    if (acordeActivo < 0 || !isPlayingAudio) return null;
    const visible = acordesDelCifrado(processedText)[acordeActivo];
    const k = normalizarAcorde(visible);
    return k ? extractUniqueChords(processedText).find((c) => normalizarAcorde(c) === k) ?? null : null;
  }, [acordeActivo, isPlayingAudio, processedText]);

  // Al cambiar de pestaña se empieza arriba: el scroll de la anterior dejaba la nueva a medias.
  useEffect(() => { scrollContainerRef.current?.scrollTo({ top: 0 }); }, [activeTab]);

  // Armonía (grados romanos y funciones): del audio si está analizado (con las correcciones de la banda)
  // y, si no, de los acordes escritos en el cifrado.
  const [estiloArmonia, setEstiloArmonia] = useState<EstiloArmonia>(() => leerEstiloArmonia());
  const cambiarEstiloArmonia = (e: EstiloArmonia) => { setEstiloArmonia(e); guardarEstiloArmonia(e); };
  const armonia = useMemo<AnalisisArmonico | null>(() => {
    const tramos = analisisAcordes
      ? analisisAcordes.segmentos.map((x) => ({ t0: x.t0, t1: x.t1, acorde: x.acorde }))
      : acordesDelCifrado(cifradoTexto).map((a, i) => ({ t0: i, t1: i + 1, acorde: a }));
    return analizarArmonia(tramos, song.tonalidad);
  }, [analisisAcordes, cifradoTexto, song.tonalidad]);
  // Tonalidad tal como se ve (transpuesta y en el idioma elegido) y acordes de la canción por función, para
  // explicar los colores con ejemplos reales.
  const nombreTonalidadVista = armonia
    ? `${nombreDeNota(armonia.tonalidad.tonica + transpose, usaBemoles(armonia.tonalidad, armonia.modo.id), notation)}${armonia.tonalidad.menor ? " menor" : " mayor"}`
    : "";
  const acordesPorFuncion = useMemo(() => {
    const salida: Partial<Record<Funcion, Array<{ nombre: string; grado: string }>>> = {};
    for (const r of armonia?.acordes ?? []) {
      (salida[r.funcion] ??= []).push({ nombre: processChordText(`[${r.acorde}]`, transpose, notation).replace(/[[\]]/g, ""), grado: gradoVisible(r.grado, estiloArmonia) });
    }
    return salida;
  }, [armonia, transpose, notation, estiloArmonia]);
  const funcionesPresentes = useMemo<Funcion[]>(
    () => (armonia ? (Object.keys(armonia.funciones) as Funcion[]).filter((f) => armonia.funciones[f] > 0.005) : []),
    [armonia],
  );

  // Vibración al cambiar de acorde (móvil): se «siente» el cambio sin mirar la pantalla. Opcional y por dispositivo.
  const [vibrarAlCambiar, setVibrarAlCambiar] = useState<boolean>(() => {
    try { return localStorage.getItem("bm_vibrar_acorde") === "1"; } catch { return false; }
  });
  const alternarVibracion = (v: boolean) => {
    setVibrarAlCambiar(v);
    try { localStorage.setItem("bm_vibrar_acorde", v ? "1" : "0"); } catch { /* sin almacenamiento: vale solo esta sesión */ }
    if (v) navigator.vibrate?.(40); // prueba inmediata
  };
  const ultimoAcordeVibrado = useRef(-1);
  useEffect(() => {
    if (acordeActivo === ultimoAcordeVibrado.current) return;
    ultimoAcordeVibrado.current = acordeActivo;
    if (vibrarAlCambiar && isPlayingAudio && acordeActivo >= 0) navigator.vibrate?.(35);
  }, [acordeActivo, vibrarAlCambiar, isPlayingAudio]);
  const letraActiva =
    lineasConLetra && letraTranscrita && seguirEnCifrado && (isPlayingAudio || audioCurrentTime > 0)
      ? indiceSegmentoEn(letraTranscrita, audioCurrentTime)
      : -1;

  // Mantiene a la vista lo que está sonando: la línea de la letra si hay letra con tiempos y, si no,
  // el acorde (con el autoscroll manual apagado, para no pelearse con él).
  useEffect(() => {
    if (!isPlayingAudio || isAutoScrolling) return;
    const objetivo = letraActiva >= 0 ? `letra-linea-${letraActiva}` : acordeActivo >= 0 ? `cifrado-acorde-${acordeActivo}` : null;
    if (objetivo) document.getElementById(objetivo)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [acordeActivo, letraActiva, isPlayingAudio, isAutoScrolling]);
  const uniqueChords = extractUniqueChords(processedText);
  const contextoAcordes = useMemo(
    () => contextoDeAcordes(processedText, uniqueChords, armonia?.tonalidad ?? null, transpose),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [processedText, armonia, transpose],
  );

  // Copy chords to clipboard
  const handleCopyChords = () => {
    navigator.clipboard.writeText(processedText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <ModalPortal isOpen={true} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] bg-[var(--scrim)]/85 flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain">
        <div className="relative bg-[var(--surface)] rounded-[var(--r-l)] w-full max-w-5xl h-[92vh] flex flex-col overflow-y-auto overscroll-contain md:overflow-hidden text-[var(--ink)] my-auto">
          {/* CLOSE BUTTON — fixed to the modal's top-right corner, independent of header actions */}
          <Button
            variant="neutral"
            size="xs"
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-20"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </Button>

          {/* MODAL HEADER */}
          <div className="bg-[var(--sunken)] p-4 pr-12 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              {/* INTERACTIVE PLAY / PAUSE BUTTON */}
              <button
                type="button"
                onClick={handleToggleAudio}
                className={`p-2.5 rounded-[var(--r-pill)] transition-ui cursor-pointer flex items-center justify-center shrink-0 ${
                  isPlayingAudio
                    ? "bg-[var(--ink)] text-[var(--bg)]"
                    : audioUrl
                      ? "bg-[var(--acc-soft)] hover:brightness-95 text-[var(--acc-ink)]"
                      : "bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)]"
                }`}
                title={
                  isPlayingAudio
                    ? "Pausar audio de la canción"
                    : audioUrl
                      ? "Reproducir audio de la canción (Escuchar mientras lees el cifrado)"
                      : "Esta canción no tiene archivo de audio adjunto en Repertorio"
                }
              >
                {isPlayingAudio ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current pl-0.5" />
                )}
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-[var(--ink)]">
                    {formatSongTitle(song.titulo)}
                  </h2>
                  {song.esVersionCovers && (
                    <span className="text-micro font-sans px-2 py-0.5 rounded bg-[var(--tentative)] text-[var(--on-tentative)]">
                      Cover
                    </span>
                  )}
                  {isPlayingAudio && (
                    <span className="inline-flex items-center gap-1 text-micro font-mono px-2 py-0.5 rounded-full bg-[var(--ok)] text-[var(--on-ok)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]"></span>
                      En reproducción
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--ink-2)] font-sans mt-0.5">
                  <span>
                    Tonalidad:{" "}
                    <strong className="text-[var(--acc)]">
                      {song.tonalidad || "Mim"}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Tempo:{" "}
                    <strong className="text-[var(--ok)]">
                      {song.bpm || 120} BPM
                    </strong>
                  </span>
                  {song.afinacion && (
                    <>
                      <span>•</span>
                      <span>
                        Afinación:{" "}
                        <strong className="text-[var(--tentative)]/80">
                          {song.afinacion}
                        </strong>
                      </span>
                    </>
                  )}
                  {song.duracion && (
                    <>
                      <span>•</span>
                      <span>
                        Duración:{" "}
                        <strong className="text-[var(--ink-2)]">
                          {song.duracion}
                        </strong>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* AI Generate — the main action, keeps its label */}
              <Button
                variant="primary"
                size="xs"
                type="button"
                onClick={handleGenerateWithAi}
                disabled={isGeneratingAi}
                className="items-center gap-1.5"
                title={
                  song.audioPrincipalUrl
                    ? "Transcribir la letra de la voz con tiempos y sincronizarla con los acordes (reconocimiento de voz; nunca se inventa a partir del título)"
                    : "Necesita el audio de la canción: sin audio no se puede transcribir nada"
                }
              >
                <Wand2
                  className={`w-4 h-4 text-[var(--acc-ink)] ${isGeneratingAi ? "animate-spin" : ""}`}
                />
                <span>{isGeneratingAi ? "Escuchando…" : "Letra del audio"}</span>
              </Button>

              {/* Detección propia de acordes con tiempos, sin IA generativa */}
              {audioUrl && (
                <Button
                  variant="neutral"
                  size="xs"
                  type="button"
                  onClick={analisisAcordes && !isAnalyzingChords ? () => setShowAnalisisAcordes((v) => !v) : () => handleAnalyzeChordsFromAudio()}
                  disabled={isAnalyzingChords}
                  className="items-center gap-1.5"
                  title={
                    analisisAcordes
                      ? "Ver los acordes detectados en el audio"
                      : "Detectar los acordes del audio con sus tiempos (automático, sin IA generativa)"
                  }
                >
                  <Music className="w-4 h-4" />
                  <span>{isAnalyzingChords ? "Analizando..." : analisisAcordes ? "Acordes del audio" : "Analizar acordes"}</span>
                </Button>
              )}

              {/* Secondary actions — icon-only to keep the header clean */}
              <IconButton
                label="Subir PDF, imagen o Word con acordes - IA extrae automáticamente"
                type="button"
                onClick={() => setShowStructureUploadModal(true)}
              >
                <Upload className="w-4 h-4" />
              </IconButton>

              <IconButton
                label="Compartir canción y acordes por WhatsApp o App"
                type="button"
                onClick={() => setShowShareModal(true)}
              >
                <MessageSquare className="w-4 h-4" />
              </IconButton>

              <IconButton
                label="Imprimir cifrado"
                type="button"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4" />
              </IconButton>
            </div>
          </div>

          {/* TOOLBAR CONTROLS BAR (LaCuerda / Ultimate Guitar Toolbar) */}
          <div className="bg-[var(--surface)]/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-sans shrink-0">
            {/* TABS SELECTOR */}
            <div className="flex items-center bg-[var(--sunken)] p-1 rounded-[var(--r-m)]">
              <Button
                variant={activeTab === "chords" ? "selected" : "ghost"}
                size="xs"
                type="button"
                onClick={() => setActiveTab("chords")}
                className="items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Letra y acordes</span>
              </Button>

              <Button
                variant={activeTab === "armonia" ? "selected" : "ghost"}
                size="xs"
                type="button"
                onClick={() => setActiveTab("armonia")}
                className="items-center gap-1.5"
                title="Tonalidad, modo, grados y qué tocar sobre cada acorde"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Armonía</span>
              </Button>

              <Button
                variant={activeTab === "substitute" ? "selected" : "ghost"}
                size="xs"
                type="button"
                onClick={() => setActiveTab("substitute")}
                className="items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Ficha Sustituto URGENTE</span>
              </Button>

              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={`px-3 py-1.5 rounded-[var(--r-pill)] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === "edit"
                    ? "bg-[var(--surface)]/80 text-[var(--ink)] "
                    : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
            </div>

            {/* INTERACTIVE CONTROLS (Only visible on chords tab) */}
            {activeTab === "chords" && (
              <div className="flex flex-wrap items-center gap-3">
                {/* MINI AUDIO PLAYER (REPRODUCTOR DE AUDIO INTEGRADO) */}
                <div className="flex items-center gap-2 bg-[var(--scrim)]/60 px-3 py-1 rounded-[var(--r-s)] bg-[var(--acc)]/10">
                  <Button
                    variant={isPlayingAudio ? "primary" : "neutral"}
                    size="xs"
                    type="button"
                    onClick={handleToggleAudio}
                    className="items-center justify-center"
                    title={
                      isPlayingAudio
                        ? "Pausar audio de la canción"
                        : audioUrl
                          ? "Reproducir audio de la canción"
                          : "Sin archivo de audio adjunto"
                    }
                  >
                    {isPlayingAudio ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current pl-0.5" />
                    )}
                  </Button>

                  {audioUrl ? (
                    <>
                      <IconButton
                        label="Reiniciar desde el inicio (0:00)"
                        size="icon-xs"
                        type="button"
                        onClick={handleRestartAudio}
                      >
                        <RotateCcw className="w-3 h-3" />
                      </IconButton>

                      <span className="text-xs text-[var(--acc-ink)] font-mono min-w-[32px] text-right font-semibold">
                        {formatAudioTime(audioCurrentTime)}
                      </span>

                      <input
                        type="range"
                        min={0}
                        max={audioDuration || 100}
                        step={0.1}
                        value={audioCurrentTime}
                        onChange={handleSeekAudio}
                        className="w-20 sm:w-28 h-1.5 bg-[var(--sunken)] rounded-[var(--r-s)] appearance-none cursor-pointer accent-[var(--acc)]"
                        title="Barra de posición de reproducción"
                      />

                      <span className="text-xs text-[var(--ink-2)] font-mono min-w-[32px]">
                        {formatAudioTime(audioDuration)}
                      </span>
                    </>
                  ) : (
                    <span className="text-micro text-[var(--ink-2)] italic">
                      Sin audio
                    </span>
                  )}
                </div>

                {stems.length > 1 && (
                  <SelectorEscucha modo={modoEscucha} onModo={setModoEscucha} pistas={stems} miId={miId} onMiPista={setMiPistaId} />
                )}

                {/* TRANSPOSITION CONTROL */}
                <div className="flex items-center gap-1 bg-[var(--sunken)] px-2 py-1 rounded-[var(--r-m)]">
                  <span className="text-xs text-[var(--ink-2)] mr-1">
                    Tono:
                  </span>
                  <button
                    type="button"
                    onClick={() => setTranspose((prev) => prev - 1)}
                    className="px-2 py-0.5 rounded bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 text-[var(--ink)] font-bold transition cursor-pointer"
                    title="Bajar 1 semitono"
                  >
                    -1
                  </button>
                  <span
                    className={`w-8 text-center font-bold ${transpose !== 0 ? "text-[var(--acc)]" : "text-[var(--ink-2)]"}`}
                  >
                    {transpose > 0 ? `+${transpose}` : transpose}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTranspose((prev) => prev + 1)}
                    className="px-2 py-0.5 rounded bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 text-[var(--ink)] font-bold transition cursor-pointer"
                    title="Subir 1 semitono"
                  >
                    +1
                  </button>
                  {transpose !== 0 && (
                    <IconButton
                      label="Restablecer tono original"
                      size="icon-xs"
                      type="button"
                      onClick={() => setTranspose(0)}
                      className="ml-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </IconButton>
                  )}
                </div>

                {/* NOTATION TOGGLE (Latino / C-D-E) */}
                <Button
                  variant="neutral"
                  size="xs"
                  type="button"
                  onClick={() =>
                    setNotation((prev) => (prev === "ES" ? "EN" : "ES"))
                  }
                  className="items-center gap-1"
                  title="Cambiar entre cifrado latino (Do, Re, Mi) e inglés (C, D, E)"
                >
                  <span>Cifrado:</span>
                  <span className="text-[var(--acc)]">
                    {notation === "ES" ? "Do - Re - Mi" : "C - D - E"}
                  </span>
                </Button>

                {/* AUTO-SCROLL CONTROLLER */}
                <div className="flex items-center gap-1.5 bg-[var(--sunken)] px-2 py-1 rounded-[var(--r-m)]">
                  <button
                    type="button"
                    onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                    className={`px-2.5 py-0.5 rounded-[var(--r-pill)] font-bold flex items-center gap-1 transition cursor-pointer ${
                      isAutoScrolling
                        ? "bg-[var(--ok)] text-[var(--on-ok)]"
                        : "bg-[var(--ink)]/10 text-[var(--ink)] hover:text-[var(--ink)]"
                    }`}
                    title="Iniciar/Pausar desfile automático"
                  >
                    {isAutoScrolling ? (
                      <Pause className="w-3 h-3" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                    <span>Autoscroll</span>
                  </button>

                  {isAutoScrolling && (
                    <div className="flex items-center gap-1 ml-1">
                      <span className="text-micro text-[var(--ink-2)]">
                        Vel:
                      </span>
                      {[1, 2, 3].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setScrollSpeed(v)}
                          className={`w-5 h-5 rounded text-micro font-bold flex items-center justify-center transition cursor-pointer ${
                            scrollSpeed === v
                              ? "bg-[var(--ok)] text-[var(--on-ok)]"
                              : "bg-[var(--ink)]/10 text-[var(--ink)]"
                          }`}
                        >
                          {v}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* TOGGLE CHORD DIAGRAMS */}
                <Button
                  variant={showChordDiagrams ? "inverse" : "neutral"}
                  size="xs"
                  type="button"
                  onClick={() => setShowChordDiagrams(!showChordDiagrams)}
                >
                  <ShowIcon inline emoji="🎸" />Diagramas
                </Button>

                {/* COPY BUTTON */}
                <button
                  type="button"
                  onClick={handleCopyChords}
                  className="p-1.5 rounded-[var(--r-pill)] bg-[var(--ink)]/5 hover:bg-[var(--ink)]/10 text-[var(--ink-2)] hover:text-[var(--ink)] transition cursor-pointer"
                  title="Copiar texto de acordes"
                >
                  {copiedText ? (
                    <Check className="w-4 h-4 text-[var(--ok)]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* AI SUCCESS NOTIFICATION BANNER */}
          {aiSuccessMsg && (
            <div
              className={` px-4 py-2 text-xs font-sans flex items-center justify-between animate-in fade-in ${
                aiSuccessMsg.startsWith("⚠️")
                  ? "bg-[var(--acc-soft)] text-[var(--acc-ink)]"
                  : "bg-[var(--ok-soft)]/40 text-[var(--ink-2)]"
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkles
                  className={`w-4 h-4 shrink-0 ${aiSuccessMsg.startsWith("⚠️") ? "text-[var(--acc)]" : "text-[var(--ok)]"}`}
                />
                {aiSuccessMsg}
              </span>
              <button
                onClick={() => setAiSuccessMsg(null)}
                className={
                  aiSuccessMsg.startsWith("⚠️")
                    ? "text-[var(--acc)] hover:text-[var(--ink)]"
                    : "text-[var(--ok)] hover:text-[var(--ink)]"
                }
              >
                ✕
              </button>
            </div>
          )}

          {/* AVISO DE UNA SOLA VEZ: detección de acordes del audio */}
          {audioUrl && !analisisAcordes && !avisoAcordesVisto && !isAnalyzingChords && (
            <div className="px-4 py-2 text-xs font-sans flex items-center justify-between gap-3 bg-[var(--acc-soft)] text-[var(--ink)]">
              <span className="flex items-center gap-2 min-w-0">
                <Music className="w-4 h-4 shrink-0 text-[var(--acc)]" />
                <span>
                  <strong>Nuevo:</strong> detecta los acordes de tu audio con sus tiempos y síguelos mientras suena la canción.
                </span>
              </span>
              <span className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  className="font-bold text-[var(--acc)] hover:text-[var(--ink)] cursor-pointer"
                  onClick={() => {
                    cerrarAvisoAcordes();
                    handleAnalyzeChordsFromAudio();
                  }}
                >
                  Analizar ahora
                </button>
                <button type="button" onClick={cerrarAvisoAcordes} className="text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer" aria-label="Cerrar aviso">
                  ✕
                </button>
              </span>
            </div>
          )}

          {/* ACORDES DETECTADOS DEL AUDIO */}
          {analisisAcordes && showAnalisisAcordes && activeTab === "chords" && (
            <LineaTiempoAcordes
              analisis={analisisAcordes}
              bpm={song.bpm}
              audioRef={audioRef}
              isPlaying={isPlayingAudio}
              transpose={transpose}
              notation={notation}
              isAnalyzing={isAnalyzingChords}
              onSeek={(t) => {
                if (audioRef.current) audioRef.current.currentTime = t;
                setAudioCurrentTime(t);
              }}
              onReanalizar={() => handleAnalyzeChordsFromAudio(true)}
              sincronizacion={alineacion ? { calidad: alineacion.calidad, desplazamiento: alineacion.desplazamiento, usable: alineacion.usable } : null}
              seguir={seguirEnCifrado}
              onSeguir={setSeguirEnCifrado}
              armonia={armonia}
              estilo={estiloArmonia}
              nombreTonalidad={nombreTonalidadVista}
              vibrar={vibrarAlCambiar}
              onVibrar={alternarVibracion}
              onCorregir={handleCorregirAcordes}
              onClose={() => setShowAnalisisAcordes(false)}
            />
          )}

          {/* MODAL BODY */}
          {/* En móvil la cabecera y los paneles de acordes ocupan casi toda la pantalla: el cuerpo tiene
              altura propia (75vh, con su scroll interno) y es el modal entero el que se desplaza hasta
              él. Con flex-1 el cuerpo se quedaba con una rendija y no se podía bajar a la letra. */}
          <div className="shrink-0 h-[75vh] md:h-auto md:flex-1 md:shrink overflow-hidden flex flex-col md:flex-row relative">
            {/* MAIN CONTENT AREA */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth"
            >
              {/* TAB 1: CHORDS & LYRICS SHEET (LaCuerda style) */}
              {activeTab === "chords" && (
                <div className="space-y-6 max-w-3xl mx-auto">
                  {/* SUBSTITUTE QUICK SUMMARY BANNER */}
                  {guiaSustituto?.estructura && (
                    <div className="bg-[var(--acc)]/40 p-3.5 rounded-[var(--r-m)] text-xs font-sans space-y-1.5">
                      <div className="flex items-center justify-between text-[var(--tentative)]/80 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-[var(--acc)]" />
                          Estructura Rápida para el Músico:
                        </span>
                        <LinkButton
                          size="xs"
                          onClick={() => setActiveTab("substitute")}
                        >
                          Ver ficha completa →
                        </LinkButton>
                      </div>
                      <p className="text-[var(--ink-2)] text-sm font-semibold bg-[var(--sunken)] p-2 rounded-[var(--r-s)]5">
                        {guiaSustituto.estructura}
                      </p>
                    </div>
                  )}

                  {/* THE CHORD SHEET DISPLAY */}
                  {armonia && (
                    <SelectorArmonia
                      estilo={estiloArmonia}
                      onCambio={cambiarEstiloArmonia}
                      resumen={`${armonia.tonalidad.nombre.replace("m", " menor").replace(/^([A-G]#?)$/, "$1 mayor")} · ${armonia.modo.nombre}${armonia.tonalidadEstimada ? " (estimado)" : ""}`}
                      presentes={funcionesPresentes}
                      acordesPorFuncion={acordesPorFuncion}
                      nombreTonalidad={nombreTonalidadVista}
                    />
                  )}
                  <div translate="no" className="notranslate bg-[var(--sunken)] p-6 rounded-[var(--r-l)] font-sans text-sm leading-relaxed whitespace-pre-wrap select-text">
                    {renderFormattedChordSheet(
                      processedText,
                      lineasConLetra && letraTranscrita && seguirEnCifrado
                        ? {
                            porLinea: lineasConLetra,
                            lineas: letraTranscrita,
                            activa: letraActiva,
                            onSeek: (t: number) => {
                              if (audioRef.current) audioRef.current.currentTime = t;
                              setAudioCurrentTime(t);
                            },
                          }
                        : undefined,
                      sincronizado && alineacion && analisisAcordes
                        ? {
                            pares: alineacion.pares,
                            tiempos: tiemposAcordes,
                            activo: acordeActivo,
                            audioRef,
                            duracion: analisisAcordes.duracionSegundos,
                            onSeek: (t: number) => {
                              if (audioRef.current) audioRef.current.currentTime = t;
                              setAudioCurrentTime(t);
                            },
                          }
                        : undefined,
                      armonia ? { tonalidad: armonia.tonalidad, transpose, estilo: estiloArmonia, nombreTonalidad: nombreTonalidadVista } : undefined,
                    )}
                  </div>
                </div>
              )}

              {/* TAB: ARMONÍA (profesor determinista) */}
              {activeTab === "armonia" && (
                armonia ? (
                  <PanelArmonia
                    armonia={armonia}
                    analisis={analisisAcordes}
                    bpm={song.bpm}
                    notation={notation}
                    transpose={transpose}
                    estilo={estiloArmonia}
                    profesor={
                      analisisAcordes ? (
                        <ProfesorIA profesor={analisisAcordes.profesor} onPedir={pedirProfesor} />
                      ) : (
                        <p className="text-xs text-[var(--ink-2)]">Para pedir la explicación del profesor, primero analiza los acordes del audio («Acordes del audio»).</p>
                      )
                    }
                  />
                ) : (
                  <div className="max-w-xl mx-auto text-center space-y-2 py-10 font-sans">
                    <GraduationCap className="w-10 h-10 mx-auto text-[var(--ink-2)]" />
                    <p className="font-bold text-[var(--ink)]">Aún no hay armonía que contar.</p>
                    <p className="text-sm text-[var(--ink-2)]">
                      Escribe el cifrado de la canción o pulsa «Acordes del audio» y aquí verás la tonalidad, el modo, los grados y qué tocar sobre cada acorde.
                    </p>
                  </div>
                )
              )}

              {/* TAB 2: SUBSTITUTE QUICK GUIDE (FICHA PARA MÚSICO SUSTITUTO) */}
              {activeTab === "substitute" && (
                <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in">
                  <div className="bg-[var(--acc)] p-6 rounded-[var(--r-l)] space-y-5">
                    <div className="flex items-center gap-3/30 pb-4">
                      <div className="p-3 rounded-[var(--r-m)] bg-[var(--acc)] text-[var(--on-acc)]">
                        <UserCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[var(--ink)]">
                          Ficha de sustitución urgente
                        </h3>
                        <p className="text-xs text-[var(--tentative)]/80 font-sans">
                          Resumen express para tocar el tema correctamente en
                          directo o ensayo sin margen de error.
                        </p>
                      </div>
                    </div>

                    {/* GUIDES GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                      <div className="bg-[var(--sunken)] p-4 rounded-[var(--r-m)] space-y-1.5">
                        <span className="text-[var(--acc)] font-bold block text-xs">
                          1. Estructura Exacta del Tema
                        </span>
                        <p className="text-[var(--ink)] text-sm font-semibold leading-relaxed">
                          {guiaSustituto.estructura ||
                            "Sin estructura definida."}
                        </p>
                      </div>

                      <div className="bg-[var(--sunken)] p-4 rounded-[var(--r-m)] space-y-1.5">
                        <span className="text-[var(--ok)] font-bold block text-xs">
                          2. Progresión Armónica Clave
                        </span>
                        <p className="text-[var(--ink)] text-sm font-semibold leading-relaxed">
                          {guiaSustituto.progresionClave ||
                            "Ver cifrado completo."}
                        </p>
                      </div>

                      <div className="bg-[var(--sunken)] p-4 rounded-[var(--r-m)] space-y-1.5">
                        <span className="text-[var(--alert)] font-bold block text-xs">
                          3. Cortes, Entradas y Claves
                        </span>
                        <p className="text-[var(--ink-2)] leading-relaxed">
                          {guiaSustituto.cortesYClaves ||
                            "Sin indicaciones especiales de cortes."}
                        </p>
                      </div>

                      <div className="bg-[var(--sunken)] p-4 rounded-[var(--r-m)] space-y-1.5">
                        <span className="text-[var(--tentative)]/80 font-bold block text-xs">
                          4. Capo / afinación
                        </span>
                        <p className="text-[var(--ink-2)] leading-relaxed">
                          {guiaSustituto.capoTraste || "Standard / Sin Capo"}
                        </p>
                      </div>

                      <div className="sm:col-span-2 bg-[var(--sunken)] p-4 rounded-[var(--r-m)] space-y-1.5">
                        <span className="text-[var(--acc)] font-bold block text-xs">
                          5. Protagonismo de instrumentos / arreglos
                        </span>
                        <p className="text-[var(--ink-2)] leading-relaxed">
                          {guiaSustituto.instrumentosClave ||
                            "Seguir el pulso principal de batería y bajo."}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="primary"
                        size="sm"
                        type="button"
                        onClick={() => setActiveTab("edit")}
                        className="items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Editar esta ficha de sustitución</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: EDIT MODE */}
              {activeTab === "edit" && (
                <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in">
                  <div className="bg-[var(--surface)]/90 p-5 rounded-[var(--r-l)] space-y-4">
                    <div className="flex items-center justify-between pb-3">
                      <h3 className="font-bold text-[var(--ink)] flex items-center gap-2 text-sm font-sans">
                        <Edit3 className="w-4 h-4 text-[var(--acc)]" />
                        Editor de cifrado y ficha
                      </h3>
                      <Button
                        variant="primary"
                        size="sm"
                        type="button"
                        onClick={handleSaveEdits}
                        className="items-center gap-1.5"
                      >
                        <Save className="w-4 h-4" />
                        <span>Guardar cambios</span>
                      </Button>
                    </div>

                    <div>
                      <label className="text-xs font-sans font-bold text-[var(--acc)] block mb-1">
                        Texto con Letra y Acordes (Formato LaCuerda o [Acorde]
                        inline):
                      </label>
                      <Textarea
                        value={cifradoTexto}
                        onChange={(e) => setCifradoTexto(e.target.value)}
                        rows={14}
                        className="w-full"
                        placeholder={`[Intro]\nMim  Do  Re  Mim\n\n[Estribillo]\n[Sol] Que tiene tu [Re] veneno [Mim] ...`}
                      />
                    </div>

                    <div className="pt-3 space-y-3">
                      <h4 className="text-xs font-sans font-bold text-[var(--tentative)]/80">
                        Campos de la Ficha del Músico Sustituto:
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                        <div>
                          <label className="text-[var(--ink-2)] block mb-0.5">
                            Estructura Exacta del Tema:
                          </label>
                          <Input
                            size="sm"
                            type="text"
                            value={guiaSustituto.estructura || ""}
                            onChange={(e) =>
                              setGuiaSustituto({
                                ...guiaSustituto,
                                estructura: e.target.value,
                              })
                            }
                            className="w-full"
                            placeholder="Intro -> Verso -> Estribillo -> Outro"
                          />
                        </div>

                        <div>
                          <label className="text-[var(--ink-2)] block mb-0.5">
                            Progresiones Clave:
                          </label>
                          <Input
                            size="sm"
                            type="text"
                            value={guiaSustituto.progresionClave || ""}
                            onChange={(e) =>
                              setGuiaSustituto({
                                ...guiaSustituto,
                                progresionClave: e.target.value,
                              })
                            }
                            className="w-full"
                            placeholder="Verso: Mim - Do | Estribillo: Sol - Re"
                          />
                        </div>

                        <div>
                          <label className="text-[var(--ink-2)] block mb-0.5">
                            Cortes y Claves en Vivo:
                          </label>
                          <Input
                            size="sm"
                            type="text"
                            value={guiaSustituto.cortesYClaves || ""}
                            onChange={(e) =>
                              setGuiaSustituto({
                                ...guiaSustituto,
                                cortesYClaves: e.target.value,
                              })
                            }
                            className="w-full"
                            placeholder="Parón en compás 8…"
                          />
                        </div>

                        <div>
                          <label className="text-[var(--ink-2)] block mb-0.5">
                            Capo / Afinación:
                          </label>
                          <Input
                            size="sm"
                            type="text"
                            value={guiaSustituto.capoTraste || ""}
                            onChange={(e) =>
                              setGuiaSustituto({
                                ...guiaSustituto,
                                capoTraste: e.target.value,
                              })
                            }
                            className="w-full"
                            placeholder="Capo 2º traste"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR: CHORD DIAGRAMS DRAWER */}
            {activeTab === "chords" && showChordDiagrams && (
              <div translate="no" className="notranslate w-full md:w-64 bg-[var(--sunken)] md:border-t-0 md:border-l p-4 overflow-y-auto shrink-0 space-y-4">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-sans font-bold text-[var(--acc)] flex items-center gap-1.5">
                    <ShowIcon inline emoji="🎸" />Acordes ({uniqueChords.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowChordDiagrams(false)}
                    className="text-[var(--ink-2)] hover:text-[var(--ink)] text-xs"
                  >
                    ✕
                  </button>
                </div>

                <SelectorVistaAcorde vista={vistaAcordes} onCambio={setVistaAcordes} />

                {uniqueChords.length === 0 ? (
                  <p className="text-xs text-[var(--ink-2)] font-sans italic">
                    No se detectaron acordes en el texto.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
                    {ordenarPorTonica(uniqueChords, contextoAcordes).map((chord) => (
                      <CajaAcorde key={chord} sonando={chord === acordeSonando} chord={chord} vista={vistaAcordes} contexto={contextoAcordes.get(chord)} grado={estiloArmonia.mostrar === "nombre" ? undefined : (contextoAcordes.get(chord)?.info ? gradoVisible(contextoAcordes.get(chord)!.info!.grado, estiloArmonia) : undefined)} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SHARE MODAL FOR WHATSAPP / APPS */}
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title={song.titulo}
          subtitle="Canción y cifrado para WhatsApp"
          initialText={formatSongShareText(song, {
            includeChords: true,
            includeGuide: true,
          })}
          itemType="song"
        />

        <ModalOido
          abierto={(isAnalyzingChords || isGeneratingAi) && !oidoOculto}
          tarea={isGeneratingAi ? "letra" : "acordes"}
          songId={song.id}
          titulo={song.titulo}
          onOcultar={() => setOidoOculto(true)}
        />

        {/* STRUCTURE UPLOAD MODAL */}
        <SongStudioStructureUploadModal
          song={song}
          isOpen={showStructureUploadModal}
          onClose={() => setShowStructureUploadModal(false)}
          onUpdateSong={onUpdateSong}
        />

        {/* HIDDEN HTML AUDIO ELEMENT FOR IN-MODAL PLAYBACK */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            preload="metadata"
            onTimeUpdate={() => {
              if (audioRef.current) {
                setAudioCurrentTime(audioRef.current.currentTime);
              }
            }}
            onLoadedMetadata={() => {
              if (audioRef.current && audioRef.current.duration) {
                setAudioDuration(audioRef.current.duration);
              }
            }}
            onEnded={() => {
              setIsPlayingAudio(false);
              setAudioCurrentTime(0);
            }}
            onPause={() => setIsPlayingAudio(false)}
            onPlay={() => setIsPlayingAudio(true)}
          />
        )}
      </div>
    </ModalPortal>
  );
}

// RENDER FUNCTION FOR FORMATTED CHORD SHEET WITH HIGHLIGHTED CHORDS
interface SincronizacionCifrado {
  pares: Alineacion["pares"];
  /** Instante (s) de cada acorde del cifrado, en orden de aparición. */
  tiempos: number[];
  activo: number;
  /** Para el reloj de cada acorde: el audio que suena y la duración total. */
  audioRef: React.RefObject<HTMLAudioElement | null>;
  duracion: number;
  onSeek: (segundos: number) => void;
}

interface ArmoniaVisible {
  tonalidad: AnalisisArmonico["tonalidad"];
  transpose: number;
  estilo: EstiloArmonia;
  /** Tonalidad tal como se ve («Mi mayor»), para explicar los acordes. */
  nombreTonalidad: string;
}

interface SincronizacionLetra {
  porLinea: Array<number | null>; // por cada línea del cifrado, la línea de letra transcrita (o null)
  lineas: Array<{ t0: number; t1: number }>;
  activa: number; // línea de letra que suena ahora (-1 ninguna)
  onSeek: (segundos: number) => void;
}

export function renderFormattedChordSheet(text: string, letra?: SincronizacionLetra, sync?: SincronizacionCifrado, armonia?: ArmoniaVisible) {
  if (!text)
    return (
      <span className="text-[var(--ink-2)] italic">
        Sin cifrado todavía. Escríbelo, sube un PDF o imagen, o pulsa «Letra del audio» para transcribirlo de la voz.
      </span>
    );

  const lines = text.split("\n");
  // Orden de aparición de los acordes entre corchetes: debe coincidir con acordesDelCifrado().
  let ordinal = 0;

  // Propiedades de una línea de letra con tiempos: resaltada si suena ahora, y clicable para saltar.
  const propsDeLetra = (idx: number) => {
    const k = letra ? letra.porLinea[idx] : null;
    if (!letra || k === null || k === undefined || !letra.lineas[k]) return {};
    return {
      id: `letra-linea-${k}`,
      onClick: () => letra.onSeek(letra.lineas[k].t0),
      title: "Saltar a esta frase",
      className: `${k === letra.activa ? "bg-[var(--acc-soft)] rounded-[var(--r-s)] ring-1 ring-[var(--acc)]" : "hover:bg-[var(--surface)] rounded-[var(--r-s)]"} cursor-pointer transition-ui py-0.5`,
    };
  };

  return lines.map((line, idx) => {
    // Check if section header like [Intro], [Estribillo], [Solo], etc.
    if (esLineaCabecera(line)) {
      return (
        <div
          key={idx}
          className="text-[var(--acc)] font-bold text-base my-2 pt-2 flex items-center gap-2"
        >
          <span className="px-2.5 py-0.5 rounded bg-[var(--acc)] text-[var(--on-acc)]">
            {line.trim()}
          </span>
        </div>
      );
    }

    // Check if inline bracket chord format: [Do] Que tiene tu [Sol] veneno
    if (line.includes("[")) {
      const letraProps = propsDeLetra(idx);

      // Un acorde de la línea, listo para pintar (botón si está sincronizado con el audio).
      const nodoAcorde = (chordName: string, key: string) => {
        const k = esTokenAcorde(chordName) ? ordinal++ : -1;
        const par = sync && k >= 0 ? sync.pares[k] : undefined;
        // Armonía: grado y función de este acorde, y cómo se pinta según el estilo elegido.
        const info = armonia && k >= 0 ? infoDeAcordeVisible(chordName, armonia.tonalidad, armonia.transpose) : null;
        const colorear = armonia?.estilo.colorear === "funcion" && info;
        const clasePasiva = colorear ? CLASE_FUNCION[info.funcion] : "text-[var(--acc)] bg-[var(--acc-soft)]";
        const texto = textoDeAcorde(chordName, info && armonia ? gradoVisible(info.grado, armonia.estilo) : undefined, armonia?.estilo.mostrar ?? "nombre");
        const contenido = (
          <>
            {texto.principal}
            {texto.secundario && <sup className="ml-0.5 text-micro font-normal opacity-80">{texto.secundario}</sup>}
          </>
        );
        const funcionTitulo = info && armonia ? ` · ${explicarAcorde(info, chordName, armonia.nombreTonalidad, armonia.estilo.grados)}` : "";
        if (sync && par && sync.tiempos[k] !== undefined) {
          const instante = sync.tiempos[k];
          return (
            <RelojEnAcorde key={key} activo={k === sync.activo} indice={k} tiempos={sync.tiempos} duracionTotal={sync.duracion} audioRef={sync.audioRef}>
            <button
              id={`cifrado-acorde-${k}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                sync.onSeek(instante);
              }}
              title={`Saltar a ${Math.floor(instante / 60)}:${String(Math.floor(instante % 60)).padStart(2, "0")}${par.coincide ? "" : " · en el audio suena otro acorde"}${funcionTitulo}`}
              className={`font-bold px-1 rounded text-xs leading-5 cursor-pointer transition-ui ${
                k === sync.activo
                  ? "bg-[var(--surface)] text-[var(--ink)]"
                  : `${clasePasiva} hover:brightness-95`
              } ${par.coincide ? "" : "underline decoration-dashed decoration-2 underline-offset-4"}`}
            >
              {contenido}
            </button>
            </RelojEnAcorde>
          );
        }
        return (
          <span key={key} title={funcionTitulo ? funcionTitulo.slice(3) : undefined} className={`font-bold ${clasePasiva} px-1 rounded mr-0.5 text-xs leading-5`}>
            {contenido}
          </span>
        );
      };

      // Estilo cifrado clásico: el acorde va ENCIMA del texto, sobre la sílaba en la que cambia.
      // Cada palabra es una unidad que no se parte (puede llevar un acorde a mitad: «imagi|nación»);
      // entre palabras hay espacios normales, así que la línea se ajusta sola al ancho.
      return (
        <div key={idx} className="py-0.5" {...letraProps}>
          {line.split(/(\s+)/).map((token, tIdx) => {
            if (token === "" || /^\s+$/.test(token)) return token;
            const piezas: { acorde: React.ReactNode; texto: string }[] = [];
            let pendiente: React.ReactNode = null;
            token.split(/(\[[A-Za-z0-9#\/]+\])/g).forEach((parte, pIdx) => {
              if (parte.startsWith("[") && parte.endsWith("]")) {
                if (pendiente) piezas.push({ acorde: pendiente, texto: "" });
                pendiente = nodoAcorde(parte.slice(1, -1), `${tIdx}-${pIdx}`);
              } else if (parte) {
                piezas.push({ acorde: pendiente, texto: parte });
                pendiente = null;
              }
            });
            if (pendiente) piezas.push({ acorde: pendiente, texto: "" });
            return (
              <span key={tIdx} className="inline-block whitespace-nowrap align-bottom">
                {piezas.map((pz, i) => (
                  <span key={i} className="inline-flex flex-col align-bottom">
                    <span className="h-7 leading-7 mr-0.5">{pz.acorde ?? "\u00A0"}</span>
                    <span className="whitespace-pre text-[var(--ink-2)]">{pz.texto || "\u00A0"}</span>
                  </span>
                ))}
              </span>
            );
          })}
        </div>
      );
    }

    // Otherwise check if line contains chords separated by spaces. Usa el mismo validador de
    // acordes (parseRootNote) que la transposición y la lista de diagramas: antes esta línea
    // tenía su propia regex duplicada que solo miraba si el token EMPEZABA por una nota, sin
    // validar el resto ("Get","Fire","Baby" contaban como acordes en letras en inglés).
    const tokens = line.trim().split(/\s+/);
    const chordCount = tokens.filter((t) => parseRootNote(t) !== null).length;
    const isChordLine = chordCount > 0 && chordCount / tokens.length >= 0.7;

    if (isChordLine) {
      return (
        <div
          key={idx}
          className="font-bold text-[var(--acc)] text-sm py-0.5 leading-none select-none"
        >
          {line}
        </div>
      );
    }

    // Standard lyrics line
    return (
      <div key={idx} className="text-[var(--ink-2)] py-0.5" {...propsDeLetra(idx)}>
        {line || "\u00A0"}
      </div>
    );
  });
}
