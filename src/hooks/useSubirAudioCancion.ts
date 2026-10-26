import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { Song } from "../types";
import { analizarAcordesDelAudio } from "../utils/analisisAcordesCliente";
import { apiFetch } from "../utils/api";
import { conAudioNuevo, esUrlSubida, leerDuracionSegundos, tieneAudioReal } from "../utils/audioDeCancion";
import { uploadFileToServer } from "../utils/audioStorage";

interface Opciones {
  bandId?: string;
  /** Recibe la canción ya guardada con su audio nuevo. */
  alActualizar: (song: Song) => void;
}

/**
 * Poner (o reemplazar) el audio de UNA canción. Sustituye al emparejado por nombre del modal de disco
 * para el caso normal: aquí no hay que adivinar a qué canción va el archivo. Si la canción ya tiene
 * audio propio se pregunta antes de pisarlo, y si la subida falla no se guarda nada.
 *
 * El consumidor pinta `<input {...inputProps} />` una vez y llama a `abrir(song)` desde el menú.
 */
export function useSubirAudioCancion({ bandId, alActualizar }: Opciones) {
  const inputRef = useRef<HTMLInputElement>(null);
  const destino = useRef<Song | null>(null);
  const [subiendoId, setSubiendoId] = useState<string | null>(null);

  const abrir = (song: Song) => {
    destino.current = song;
    inputRef.current?.click();
  };

  const alElegir = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    const song = destino.current;
    destino.current = null;
    if (!archivo || !song) return;
    if (tieneAudioReal(song) && !window.confirm(`«${song.titulo}» ya tiene audio. ¿Reemplazarlo por «${archivo.name}»?`)) return;
    if (!bandId) {
      console.warn("[Audio de canción] no hay ninguna banda activa: no se sube nada.");
      return;
    }

    setSubiendoId(song.id);
    const objectUrl = URL.createObjectURL(archivo);
    try {
      const segundos = await leerDuracionSegundos(objectUrl);
      const carpeta = (song.albumDisco || song.album || "sin_disco").replace(/[^a-zA-Z0-9_-]/g, "_");
      const url = await uploadFileToServer(archivo, { bandId, category: "audio", folder: `discografia/${carpeta}` });
      // Si la subida falla, uploadFileToServer devuelve una referencia local; guardarla dejaría la canción sin audio.
      if (!esUrlSubida(url)) throw new Error("No se pudo subir el audio al servidor.");

      const actualizada = conAudioNuevo(song, url, segundos);
      const guardada = await apiFetch<{ song?: Song }>(`/api/songs/${encodeURIComponent(song.id)}`, {
        method: "PUT",
        body: JSON.stringify(actualizada),
      });
      alActualizar(guardada?.song || actualizada);
      analizarAcordesDelAudio(song.id).catch((err) => console.warn("No se pudieron analizar los acordes de", song.titulo, err));
    } catch (err) {
      // El aviso al usuario lo emite el envoltorio global de guardados fallidos (saveErrors.ts).
      console.error(`Error subiendo el audio de «${song.titulo}»:`, err);
    } finally {
      URL.revokeObjectURL(objectUrl);
      setSubiendoId(null);
    }
  };

  const inputProps = {
    ref: inputRef,
    type: "file" as const,
    accept: "audio/*,.mp3,.wav,.m4a,.flac,.ogg",
    className: "hidden",
    "aria-label": "Subir el audio de una canción",
    onChange: alElegir,
  };

  return { abrir, subiendoId, inputProps };
}
