/**
 * Hoja de ruta de un estreno: qué hacer y cuándo, contando hacia atrás desde la fecha de salida.
 * Lógica pura, mismo patrón que la campaña de un bolo (`campanaConcierto.ts`): hitos con fecha, y
 * nada se publica solo. Son tareas de fuera de las redes (distribuidor, pitch a playlists, prensa)
 * más lo que se publica en ellas.
 *
 * Los plazos son criterio propio basado en cómo funcionan las plataformas (Spotify pide el pitch con
 * al menos 7 días de margen y para una sola canción por lanzamiento); no son del temario.
 */
import { diasEntre, sumarDias } from '../campanaConcierto';

export type HitoLanzamientoId = 'distribuidor' | 'pitch' | 'presave' | 'teaser' | 'prensa' | 'cuenta_atras' | 'estreno' | 'seguimiento';

export interface HitoLanzamiento {
  id: HitoLanzamientoId;
  /** AAAA-MM-DD en que conviene hacerlo. */
  fecha: string;
  /** Días que faltan para el estreno desde esa fecha (negativo si es después). */
  diasAntes: number;
  estado: 'pasado' | 'hoy' | 'proximo';
  titulo: string;
  objetivo: string;
}

/** Por orden cronológico. */
export const DEFINICION: Array<{ id: HitoLanzamientoId; antes: number; titulo: string; objetivo: string }> = [
  { id: 'distribuidor', antes: 28, titulo: 'Subir la canción al distribuidor', objetivo: 'Sin la entrega hecha con margen no hay fecha segura de estreno ni se puede pedir sitio en las playlists.' },
  { id: 'pitch', antes: 21, titulo: 'Enviar la canción a las playlists de Spotify', objetivo: 'Se hace desde Spotify for Artists, con al menos 7 días de margen y para una sola canción por lanzamiento.' },
  { id: 'presave', antes: 21, titulo: 'Publicar el enlace de pre-guardado', objetivo: 'Quien la guarda antes de estrenar la tiene en su biblioteca el primer día.' },
  { id: 'teaser', antes: 14, titulo: 'Primer teaser (reel de 10 segundos)', objetivo: 'Calentar al público con los mejores segundos de la canción, sin darla entera.' },
  { id: 'prensa', antes: 10, titulo: 'Avisar a blogs, radios y playlists independientes', objetivo: 'Con diez días de margen todavía pueden programarla o escribir sobre ella.' },
  { id: 'cuenta_atras', antes: 3, titulo: 'Stories con cuenta atrás', objetivo: 'Quien activa el aviso la escucha el primer día, que es el que más pesa.' },
  { id: 'estreno', antes: 0, titulo: 'Día del estreno', objetivo: 'Poned la canción en la bio ese día, publicad y pedid que la guarden.' },
  { id: 'seguimiento', antes: -7, titulo: 'Mirar cómo ha ido', objetivo: 'Una semana después ya hay números: qué funcionó y qué repetir en el siguiente.' },
];

/** Todos los hitos de un estreno con su fecha y su estado respecto a hoy. [] si la fecha no es válida. */
export function hitosLanzamiento(fechaLanzamiento: string, hoy: string): HitoLanzamiento[] {
  if (!Number.isFinite(diasEntre(hoy, fechaLanzamiento))) return [];
  return DEFINICION.map(({ id, antes, titulo, objetivo }) => {
    const fecha = sumarDias(fechaLanzamiento, -antes);
    return { id, fecha, diasAntes: antes, estado: fecha < hoy ? 'pasado' : fecha === hoy ? 'hoy' : 'proximo', titulo, objetivo };
  });
}

/** Lo siguiente que toca: el hito de hoy, o el primero que queda. null si ya pasaron todos. */
export function proximoHito(fechaLanzamiento: string, hoy: string): HitoLanzamiento | null {
  return hitosLanzamiento(fechaLanzamiento, hoy).find((h) => h.estado !== 'pasado') ?? null;
}
