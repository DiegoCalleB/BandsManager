import type { Song } from "../types";
import { formatSecondsToMmSs } from "./repertorioUtils";

/** Id único en el cliente: `prefijo_<ms>[_<indice>]_<4 caracteres aleatorios>`. Solo se llama desde handlers. */
export function idUnico(prefijo: string, indice?: number): string {
  const sufijo = Math.random().toString(36).substring(2, 6);
  return indice === undefined ? `${prefijo}_${Date.now()}_${sufijo}` : `${prefijo}_${Date.now()}_${indice}_${sufijo}`;
}

const REFERENCIA_LOCAL = /^(indexeddb|blob):/i;

/**
 * ¿Es una URL a la que llega cualquier dispositivo? `uploadFileToServer` devuelve una referencia local
 * (`indexeddb:`) cuando la subida falla: guardarla en la canción la deja sin audio para el servidor.
 */
export function esUrlSubida(url: string | undefined): url is string {
  return Boolean(url) && !REFERENCIA_LOCAL.test(url as string);
}

/** ¿La canción tiene audio propio? Ni los de muestra del repo ni las referencias locales cuentan. */
export function tieneAudioReal(song: Pick<Song, "audioPrincipalUrl">): boolean {
  const url = song.audioPrincipalUrl?.trim();
  return esUrlSubida(url) && !url.startsWith("/audio/samples/");
}

/** Número de pista de la siguiente canción de un disco: detrás de la última, sin repetir. */
export function siguientePista(songs: Array<Pick<Song, "ordenAlbum">>): number {
  return Math.max(0, ...songs.map((s) => s.ordenAlbum || 0)) + 1;
}

/**
 * La canción con el audio nuevo como principal y como «Audio Máster Completo». La preview oficial
 * anterior se retira de las ideas; el resto de campos (título, BPM, notas...) no se tocan.
 */
export function conAudioNuevo(song: Song, url: string, durationSeconds: number, portadaUrl?: string): Song {
  return {
    ...song,
    duracion: formatSecondsToMmSs(durationSeconds),
    duracionSegundos: durationSeconds,
    duracionMinutos: Math.max(1, Math.round(durationSeconds / 60)),
    audioPrincipalUrl: url,
    portadaUrl: portadaUrl || song.portadaUrl,
    audioIdeas: [
      {
        id: idUnico("idea_master"),
        titulo: "Audio Máster Completo (Estudio)",
        seccion: "general",
        audioUrl: url,
        subidoPor: "Subida Disco",
        fecha: new Date().toISOString(),
      },
      ...(song.audioIdeas || []).filter((a) => !a.titulo.toLowerCase().includes("preview oficial")),
    ],
  };
}

/** Duración en segundos de un audio (URL de objeto o remota); `porDefecto` si no se puede leer en 2 s. */
export function leerDuracionSegundos(url: string, porDefecto = 210): Promise<number> {
  return new Promise<number>((resolve) => {
    const audio = new Audio(url);
    audio.onloadedmetadata = () => resolve(audio.duration > 0 && !isNaN(audio.duration) ? Math.round(audio.duration) : porDefecto);
    audio.onerror = () => resolve(porDefecto);
    setTimeout(() => resolve(porDefecto), 2000);
  });
}
