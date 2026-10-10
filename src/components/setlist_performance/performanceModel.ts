import { SetlistItem,Song } from "../../types";

// Distancia mínima de swipe (px) para contar como"pasar página" y no como un scroll normal
// dentro del documento.
export const SWIPE_THRESHOLD = 60;

export const FONT_SIZES = [
  "text-base sm:text-lg",
  "text-lg sm:text-xl",
  "text-xl sm:text-2xl",
  "text-2xl sm:text-3xl",
];

// Icono/etiqueta por tipo de bloque del setlist (presentación, cambio de instrumento...) — lo
// que se muestra en modo teleprompter cuando toca un bloque en vez de una canción.
export const BLOCK_META: Record<string, { icon: string; label: string }> = {
  header: { icon: "📌", label: "Sección" },
  presentacion: { icon: "🎤", label: "Presentación" },
  intro_tema: { icon: "🔥", label: "Intro" },
  beatbox: { icon: "🎵", label: "Beatbox" },
  solo_performance: { icon: "⭐", label: "Solo / Performance" },
  cambio_instrumento: { icon: "🎸", label: "Cambio de instrumento" },
  chapa: { icon: "💬", label: "Chapa con el público" },
  descanso: { icon: "☕", label: "Descanso" },
  bis: { icon: "👏", label: "Bis" },
  otro: { icon: "📋", label: "Bloque" },
};

export const getBlockMeta = (item: SetlistItem) =>
  BLOCK_META[item.bloqueSubtipo || "otro"] || BLOCK_META.otro;
export const itemLabel = (item: SetlistItem, songs: Song[]) =>
  item.tipoItem === "cancion"
    ? songs.find((s) => s.id === item.songId)?.titulo || "Canción"
    : item.tituloCustom || getBlockMeta(item).label;
