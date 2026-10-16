/**
 * Cómo se ve el móvil de vista previa según la plataforma elegida.
 *
 * Solo lo que se reconoce de un vistazo: las pestañas de la cabecera, los botones de la columna
 * derecha, si hay disco de audio y cómo se llama el botón de seguir. No pretende ser una réplica
 * exacta: esas apps cambian su interfaz a menudo, y una copia pixel a pixel quedaría vieja.
 */
export type Plataforma = "Instagram" | "TikTok" | "YouTube" | "Facebook";

export type AccionId = "like" | "dislike" | "comment" | "share" | "send" | "save" | "more";

export interface AccionLateral {
  id: AccionId;
  /** Recuento de ejemplo o texto bajo el botón. */
  etiqueta: string;
}

export interface SkinPlataforma {
  /** Pestañas de la cabecera; `activa` es el índice de la seleccionada. */
  pestanas: string[];
  activa: number;
  acciones: AccionLateral[];
  /** Botón junto al usuario ("Seguir", "Suscribirse"); null si la plataforma no lo pone ahí. */
  seguir: string | null;
  /** TikTok muestra el avatar con un "+" en la columna de botones. */
  avatarEnColumna: boolean;
  discoAudio: boolean;
}

const SKINS: Record<Plataforma, SkinPlataforma> = {
  Instagram: {
    pestanas: ["Reels"],
    activa: 0,
    acciones: [
      { id: "like", etiqueta: "1,4 mil" },
      { id: "comment", etiqueta: "62" },
      { id: "send", etiqueta: "89" },
      { id: "more", etiqueta: "" }
    ],
    seguir: "Seguir",
    avatarEnColumna: false,
    discoAudio: true
  },
  TikTok: {
    pestanas: ["Siguiendo", "Para ti"],
    activa: 1,
    acciones: [
      { id: "like", etiqueta: "1,4 mil" },
      { id: "comment", etiqueta: "62" },
      { id: "save", etiqueta: "214" },
      { id: "share", etiqueta: "89" }
    ],
    seguir: null,
    avatarEnColumna: true,
    discoAudio: true
  },
  YouTube: {
    pestanas: ["Shorts"],
    activa: 0,
    acciones: [
      { id: "like", etiqueta: "1,4 mil" },
      { id: "dislike", etiqueta: "No me gusta" },
      { id: "comment", etiqueta: "62" },
      { id: "share", etiqueta: "Compartir" }
    ],
    seguir: "Suscribirse",
    avatarEnColumna: false,
    discoAudio: false
  },
  Facebook: {
    pestanas: ["Reels"],
    activa: 0,
    acciones: [
      { id: "like", etiqueta: "1,4 mil" },
      { id: "comment", etiqueta: "62" },
      { id: "share", etiqueta: "89" }
    ],
    seguir: "Seguir",
    avatarEnColumna: false,
    discoAudio: false
  }
};

/** Skin de la plataforma; cualquier valor desconocido cae a Instagram, que es la de siempre. */
export function skinDe(plataforma: string | undefined): SkinPlataforma {
  return SKINS[plataforma as Plataforma] ?? SKINS.Instagram;
}
