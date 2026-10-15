/**
 * Interés del público por segundo para un vídeo de YouTube (Fase de detección de momentos).
 *
 * Junta el gráfico de "lo más reproducido" (viene en la ficha) con las marcas de tiempo de los
 * comentarios, pero solo si el vídeo es de música: en una charla un pico de repeticiones significa
 * "vuelvo a una explicación", y eso llevaría al selector a elegir mal.
 */
import { curvaDeInteres, marcasDeTiempo, usarSenalesDePublico, type CurvaInteres, type PuntoInteres } from "../utils/senalesPublico.js";
import type { TipoContenido } from "../utils/viralSignals.js";
import { comentariosDelVideo, type ComentarioVideo } from "./comentariosYoutube.js";

export interface FichaPublico {
  esMusica: boolean | null;
  heatmap: PuntoInteres[];
  duration: number;
}

export interface InteresDelPublico {
  /** null = no se usa o no hay evidencia suficiente. */
  curva: CurvaInteres | null;
  /** Para decírselo a quien analiza el vídeo. */
  nota: string;
}

export async function interesDelPublico(
  p: { videoId: string; ficha: FichaPublico; tipo: TipoContenido },
  leerComentarios: (id: string) => Promise<ComentarioVideo[]> = comentariosDelVideo
): Promise<InteresDelPublico> {
  const { ficha } = p;
  if (!usarSenalesDePublico(ficha.esMusica, p.tipo)) {
    return { curva: null, nota: "Las señales de público (repeticiones y comentarios) solo se usan en vídeos de música." };
  }
  if (!(ficha.duration > 0)) return { curva: null, nota: "" };

  const comentarios = await leerComentarios(p.videoId);
  const marcas = marcasDeTiempo(comentarios, ficha.duration);
  const curva = curvaDeInteres({ duracion: ficha.duration, heatmap: ficha.heatmap, marcas });
  if (!curva) {
    return { curva: null, nota: "Este vídeo no tiene todavía datos de público suficientes (pocas vistas o sin comentarios con marca de tiempo)." };
  }
  const partes = [curva.fuentes.heatmap ? "gráfico de repeticiones de YouTube" : "", curva.fuentes.marcas > 0 ? `${curva.fuentes.marcas} marcas de tiempo en comentarios` : ""];
  return { curva, nota: `Señales de público usadas: ${partes.filter(Boolean).join(" y ")}.` };
}
