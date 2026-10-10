import type { AjustesModoAtril } from "../../../utils/modosAtril";
/**
 * Reproducción de audio del tema: stems, tomas, mezcla, bucle, grabación e ideas.
 * Extraído de Atril.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ Dispatch,SetStateAction,useEffect,useMemo,useRef,useState } from "react";
import { useBucleAB } from "../../../hooks/useBucleAB";
import { useGrabarIdea } from "../../../hooks/useGrabarIdea";
import { useMezclaGuardada } from "../../../hooks/useMezclaGuardada";
import { useMezclaStems } from "../../../hooks/useMezclaStems";
import { useSeparacionIris } from "../../../hooks/useSeparacionIris";
import { useTonoAudio } from "../../../hooks/useTonoAudio";
import { Song } from "../../../types";
import { getActiveBandId } from "../../../utils/api";
import { uploadFileToServer } from "../../../utils/audioStorage";
import { carpetaDeIdea,ficheroDeToma,tituloDeToma } from "../../../utils/grabarIdea";
import { crearIdeaDeAtril,pistasParaToma,tomasDeCancion } from "../../../utils/ideaDeAtril";
import { instrumentoDelUsuario } from "../../../utils/instrumentoProfesor";
import { cancionConIdeas,pistasDeCancion } from "../../../utils/irisTracks";
import { ModoEscucha,pistaDelUsuario,pistasParaModo } from "../../../utils/mezclaStems";
import { MotorIris,ideaParaSeparar } from "../../../utils/separacionIris";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface AtrilAudioParams {
  song: Song;
  onUpdateSong: (updated: Song) => void;
  ajustes: AjustesModoAtril;
  transpose: number;
  setAiSuccessMsg: Dispatch<SetStateAction<string>>;
}

/**
 * Reproducción de audio del tema: stems, tomas, mezcla, bucle, grabación e ideas.
 * @param params Estado y callbacks del contenedor ({@link AtrilAudioParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useAtrilAudio({ song, onUpdateSong, ajustes, transpose, setAiSuccessMsg }: AtrilAudioParams) {
  // Audio playback state
  const audioUrl =
    song.audioPrincipalUrl ||
    song.audioUrl ||
    (song.audioIdeas && song.audioIdeas.length > 0
      ? song.audioIdeas[0].audioUrl
      : "");
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  // Stems de Iris: escuchar todo, solo mi pista o todo menos mi pista
  const stems = useMemo(() => pistasDeCancion(song), [song]);
  const iris = useSeparacionIris({
    song,
    onUpdateSong,
    motor: "fal",
    pistasElegidas: ["Voz", "Batería", "Bajo", "Guitarras", "Teclados", "Arreglos"],
    cancelarAlDesmontar: true,
  });
  const separarConIris = (motor: MotorIris) => {
    const idea = ideaParaSeparar(song, audioUrl);
    if (idea) void iris.handlePerformAiStemSeparation(idea, motor);
  };
  const [masControles, setMasControles] = useState(false);
  const [modoEscucha, setModoEscucha] = useState<ModoEscucha>(ajustes.escucha);
  const [miPistaId, setMiPistaId] = useState<string | null>(null);
  const miId = miPistaId && stems.some((p) => p.id === miPistaId) ? miPistaId : (pistaDelUsuario(stems, instrumentoDelUsuario())?.id ?? null);
  const pistasModo = useMemo(() => pistasParaModo(stems, miId, modoEscucha), [stems, miId, modoEscucha]);
  // Toma escuchada con su fondo (stems elegidos): sustituye al modo de escucha mientras esté activa
  const tomas = useMemo(() => tomasDeCancion(song.audioIdeas), [song.audioIdeas]);
  const [tomaActivaId, setTomaActivaId] = useState<string | null>(null);
  const tomaActiva = tomas.find((t) => t.id === tomaActivaId) ?? null;
  const pistasSonando = useMemo(() => (tomaActiva ? pistasParaToma(tomaActiva, stems) : pistasModo), [tomaActiva, stems, pistasModo]);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(
    song.duracionSegundos || 0,
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { ajustes: ajustesPistas, setAjustes: setAjustesPistas, velocidad, setVelocidad } = useMezclaGuardada(song.id);
  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = velocidad; }, [velocidad, audioUrl]);
  const [audioSigueTono, setAudioSigueTono] = useState<boolean>(true);
  const semitonosAudio = audioSigueTono ? transpose : 0;
  useMezclaStems(audioRef, pistasSonando, audioUrl, ajustesPistas, semitonosAudio);
  useTonoAudio(audioRef, audioUrl, semitonosAudio);
  const { bucle, marcar: marcarBucle, limpiar: limpiarBucle } = useBucleAB(audioRef, audioUrl);

  // Grabar idea (modo Ensayar): la toma queda ligada a las pistas sobre las que se tocó
  const grabacion = useGrabarIdea(audioRef);
  const [guardandoIdea, setGuardandoIdea] = useState<boolean>(false);
  const guardarIdea = async () => {
    if (!grabacion.toma) return;
    setGuardandoIdea(true);
    try {
      const { extension, tipo } = ficheroDeToma(grabacion.toma.mime);
      const id = `idea-${Date.now()}`;
      const fichero = new File([grabacion.toma.blob], `${id}.${extension}`, { type: tipo });
      const url = await uploadFileToServer(fichero, { bandId: getActiveBandId() || undefined, folder: carpetaDeIdea(String(song.id)) });
      const instrumento = miId ? stems.find((p) => p.id === miId)?.nombre : undefined;
      const usuario = (() => {
        try { const u = JSON.parse(localStorage.getItem("bandmanager_user") || "{}"); return u?.name || u?.username || "Banda"; } catch { return "Banda"; }
      })();
      const idea = crearIdeaDeAtril({
        id,
        titulo: tituloDeToma(instrumento, song.audioIdeas || []),
        audioUrl: url,
        subidoPor: usuario,
        instrumento,
        sobrePistas: (pistasSonando.length > 0 ? pistasSonando : stems).map((p) => p.id),
        offsetSegundos: grabacion.offset,
      });
      onUpdateSong(cancionConIdeas(song, [...(song.audioIdeas || []), idea]));
      grabacion.descartar();
      setAiSuccessMsg("🎙️ Idea guardada en la canción.");
      setTimeout(() => setAiSuccessMsg(null), 4000);
    } catch {
      setAiSuccessMsg("⚠️ No se pudo guardar la idea. Prueba otra vez.");
      setTimeout(() => setAiSuccessMsg(null), 4000);
    } finally {
      setGuardandoIdea(false);
    }
  };

  // Sync audio duration and cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps -- al desmontar se pausa el elemento de audio vigente en ese momento, no el del montaje
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

  /** Salta a un instante del audio (segundos) y sincroniza el reloj del Atril. */
  const buscarEnAudio = (t: number) => {
    if (audioRef.current) audioRef.current.currentTime = t;
    setAudioCurrentTime(t);
  };

  return { buscarEnAudio, audioUrl, audioCurrentTime, isPlayingAudio, handleToggleAudio, handleRestartAudio, formatAudioTime, audioDuration, handleSeekAudio, stems, iris, separarConIris, modoEscucha, setModoEscucha, miId, setMiPistaId, velocidad, setVelocidad, audioSigueTono, setAudioSigueTono, bucle, marcarBucle, limpiarBucle, tomas, tomaActivaId, setTomaActivaId, pistasSonando, ajustesPistas, setAjustesPistas, grabacion, guardandoIdea, guardarIdea, setMasControles, masControles, audioRef, setAudioCurrentTime, setAudioDuration, setIsPlayingAudio };
}
