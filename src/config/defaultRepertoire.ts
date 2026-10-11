/** Constantes de UI del repertorio (tipos de ítem de show e imagen de arrastre). */
export const SHOW_ITEM_TYPES: Record<
  string,
  { label: string; icon: string; bg: string; text: string }
> = {
  header: {
    label: "Encabezado de Bloque / Sección",
    icon: "⚡",
    bg: "bg-[var(--acc)]/20",
    text: "text-[var(--acc)]",
  },
  presentacion: {
    label: "Presentación Banda / Saludo",
    icon: "🎤",
    bg: "bg-[var(--ok)]/15",
    text: "text-[var(--ok)]",
  },
  intro_tema: {
    label: "Intro / Historia del Tema",
    icon: "🗣️",
    bg: "bg-[var(--acc-soft)]/80",
    text: "text-[var(--acc)]",
  },
  beatbox: {
    label: "Performance Beatbox / Ritmo",
    icon: "🥁",
    bg: "bg-[var(--acc)]/15",
    text: "text-[var(--acc)]",
  },
  solo_performance: {
    label: "Solo de Instrumento / Jam",
    icon: "🎸",
    bg: "bg-[var(--acc-soft)]/60",
    text: "text-[var(--acc)]",
  },
  cambio_instrumento: {
    label: "Cambio Instrumento / Afinación",
    icon: "🔧",
    bg: "bg-[var(--ok)]/15",
    text: "text-[var(--ok)]",
  },
  chapa: {
    label: "Chapa / Discurso con el Público",
    icon: "💬",
    bg: "bg-[var(--acc)]/15",
    text: "text-[var(--acc)]",
  },
  descanso: {
    label: "Pausa / Intermedio / Agua",
    icon: "⏸️",
    bg: "bg-[var(--sunken)]",
    text: "text-[var(--ink-2)]",
  },
  bis: {
    label: "BIS / Parón Pre-Bis",
    icon: "💣",
    bg: "bg-[var(--alert)]/15",
    text: "text-[var(--alert)]",
  },
  otro: {
    label: "Otro Evento del Show",
    icon: "📌",
    bg: "bg-[var(--surface)]/80",
    text: "text-[var(--ink-2)]",
  },
};

// GIF 1x1 transparente para anular la "foto" fantasma que el navegador dibuja por defecto al
// arrastrar con drag-and-drop nativo (HTML5 draggable).
export const TRANSPARENT_DRAG_IMAGE =
  typeof window !== "undefined" ? new window.Image() : null;
if (TRANSPARENT_DRAG_IMAGE) {
  TRANSPARENT_DRAG_IMAGE.src =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7";
}
