/**
 * Edición del cifrado: corrección de acordes, generación con IA y guardado.
 * Extraído de Atril.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch,SetStateAction } from "react";
import { AnalisisAcordes,Song,SongSubstituteGuide } from "../../../types";
import { apiFetch } from "../../../utils/api";
import { guardarOReverter } from "../../../utils/guardarConReversion";

/** Respuesta de `/api/songs/:id/letra-sincronizada`. */
interface RespuestaLetraSincronizada {
  success?: boolean;
  error?: string;
  cifradoTexto?: string;
  song?: { guiaSustituto?: Song["guiaSustituto"] };
  analisis?: AnalisisAcordes;
  lineas?: number;
  idioma?: string;
  conAcordes?: boolean;
  fuenteLetra?: string;
}

/** Dependencias que el componente contenedor inyecta al hook. */
export interface AtrilEditingParams {
  song: Song;
  analisisAcordes: AnalisisAcordes;
  onUpdateSong: (updated: Song) => void;
  setAiSuccessMsg: Dispatch<SetStateAction<string>>;
  setIsGeneratingAi: Dispatch<SetStateAction<boolean>>;
  setOidoOculto: Dispatch<SetStateAction<boolean>>;
  setCifradoTexto: Dispatch<SetStateAction<string>>;
  setShowAnalisisAcordes: Dispatch<SetStateAction<boolean>>;
  cifradoTexto: string;
  guiaSustituto: SongSubstituteGuide;
  setActiveTab: Dispatch<SetStateAction<"chords" | "substitute" | "armonia" | "edit">>;
}

/**
 * Edición del cifrado: corrección de acordes, generación con IA y guardado.
 * @param params Estado y callbacks del contenedor ({@link AtrilEditingParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useAtrilEditing({ song, analisisAcordes, onUpdateSong, setAiSuccessMsg, setIsGeneratingAi, setOidoOculto, setCifradoTexto, setShowAnalisisAcordes, cifradoTexto, guiaSustituto, setActiveTab }: AtrilEditingParams) {
  // Corrección manual de los acordes detectados: se refleja al instante y se revierte si el
  // servidor la rechaza, para que lo que se ve sea lo que hay guardado.
  // Pide la explicación del profesor al servidor (que valida y guarda) y la refleja en la canción.
  const pedirProfesor = async (opciones: { nivel: string; instrumento: string; forzar: boolean }) => {
    const data = await apiFetch<{ profesor?: NonNullable<AnalisisAcordes["profesor"]> }>(`/api/songs/${encodeURIComponent(song.id)}/profesor-armonia`, {
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
    const token = localStorage.getItem("bandmanager_token") || localStorage.getItem("token") || "";
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
      const data = await apiFetch<RespuestaLetraSincronizada>(`/api/songs/${encodeURIComponent(song.id)}/letra-sincronizada`, {
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
    } catch (err) {
      console.error("Error generating with AI:", err);
      setAiSuccessMsg(`⚠️ ${(err instanceof Error && err.message) || "No se pudo transcribir la letra"}`);
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
      localStorage.getItem("bandmanager_token") ||
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

  return { handleGenerateWithAi, handleCorregirAcordes, pedirProfesor, handleSaveEdits };
}
