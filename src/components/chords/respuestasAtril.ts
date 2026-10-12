import type { SongSubstituteGuide, AnalisisAcordes } from "../../types";

/** Respuesta de POST /api/songs/:id/letra-sincronizada (solo los campos que usa el atril). */
export interface RespuestaLetraSincronizada {
  success?: boolean;
  error?: string;
  cifradoTexto?: string;
  song?: { guiaSustituto?: Record<string, SongSubstituteGuide> };
  analisis?: AnalisisAcordes;
  lineas?: number;
  idioma?: string;
  conAcordes?: boolean;
  fuenteLetra?: string;
}
