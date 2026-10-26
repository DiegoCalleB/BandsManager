import type { Song } from "../types";

/**
 * Canción de un disco que corresponde a un archivo de audio, o null si no hay ninguna clara.
 * Se mira primero el número de pista del nombre ("01 - Tema", "track 02", "Tema_3") y después si el
 * título está contenido en el nombre o al revés. Un archivo sin coincidencia NO se asigna a ninguna
 * canción: la subida lo trata como canción nueva, en vez de pisar el audio de otra.
 */
export function mejorCancionParaArchivo(
  fileName: string,
  songs: Song[],
  yaAsignadas: Set<string>,
): string | null {
  const cleanName = fileName.toLowerCase().replace(/\.[^/.]+$/, "");

  const numMatch =
    cleanName.match(/^(?:track\s*[-_]?)?0?(\d+)/i) ||
    cleanName.match(/(?:[-_]|\s)0?(\d+)$/);
  if (numMatch?.[1]) {
    const trackNum = parseInt(numMatch[1], 10);
    const porPista = songs.find(
      (s, idx) => !yaAsignadas.has(s.id) && (s.ordenAlbum === trackNum || idx + 1 === trackNum),
    );
    if (porPista) return porPista.id;
  }

  for (const s of songs) {
    if (yaAsignadas.has(s.id)) continue;
    const titulo = s.titulo.toLowerCase().trim();
    if (titulo && (cleanName.includes(titulo) || titulo.includes(cleanName))) return s.id;
  }
  return null;
}
