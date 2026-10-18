import {
  duracion,
  hhmm,
  ETIQUETA_TIPO,
  type Choque,
  type EventoCalendario,
  type TipoEventoCalendario,
} from './calendarConflicts';

/** Una fila del resumen: el evento en corto, sin repetir lo que ya dice el titular. */
export interface FilaChoque {
  /** `true` si es el evento de cuya ficha se habla. */
  esteEvento: boolean;
  tipo: string;
  titulo: string;
  /** Ciudad, y banda solo si el usuario ve más de una. */
  lugar?: string;
  horas?: string;
  oculto: boolean;
}

/** Tramo de cada evento en minutos absolutos (puede pasar de 1440 si acaba de madrugada). */
export interface TramoChoque {
  desde: number;
  hasta: number;
  a: [number, number];
  b: [number, number];
  /** Intersección de los dos eventos, si la hay. */
  solape?: [number, number];
}

export interface ResumenChoque {
  titular: string;
  filas: [FilaChoque, FilaChoque];
  tramo?: TramoChoque;
}

function fila(ev: EventoCalendario, esteEvento: boolean, bandasVisibles: Set<string> | undefined, variasBandas: boolean): FilaChoque {
  if (bandasVisibles && !bandasVisibles.has(ev.bandId)) {
    return { esteEvento, tipo: ETIQUETA_TIPO[ev.tipo], titulo: 'Otro compromiso en otra banda', oculto: true };
  }
  const ciudad = ev.ciudad && !ev.titulo.toLowerCase().includes(ev.ciudad.toLowerCase()) ? ev.ciudad : undefined;
  const lugar = [ciudad, variasBandas ? ev.bandName : undefined].filter(Boolean).join(' · ') || undefined;
  const horas =
    ev.inicio !== undefined ? `${hhmm(ev.inicio)}${ev.fin !== undefined ? `–${hhmm(ev.fin)}` : ''}` : undefined;
  return { esteEvento, tipo: ETIQUETA_TIPO[ev.tipo], titulo: ev.titulo, lugar, horas, oculto: false };
}

function titular(c: Choque, solape: number | undefined): string {
  const margen = duracion(c.margenMin);
  const viaje = c.viajeMin !== undefined ? duracion(c.viajeMin) : '';
  switch (c.motivo) {
    case 'solape_horario':
      return solape ? `Se solapan ${duracion(solape)}` : 'Se solapan';
    case 'margen_corto':
      return margen ? `Solo ${margen} entre uno y otro` : 'Muy poco margen entre uno y otro';
    case 'viaje_inviable':
      return viaje ? `No da tiempo: ${viaje} de viaje y hay ${margen}` : 'No da tiempo a llegar';
    case 'viaje_justo':
      return viaje ? `Muy justo: ${viaje} de viaje y hay ${margen}` : 'Muy justo para llegar';
    case 'distancia_dia':
      return viaje ? `Mismo día y a ${viaje} de viaje` : 'Mismo día y en ciudades lejanas';
    default:
      return 'Mismo día, sin horas que lo descarten';
  }
}

/**
 * Un choque en forma de dos filas y, si hay horas de ambos, un tramo para dibujarlo. Es el
 * mismo dato que `describirChoque`, pero troceado para pintarlo sin repetir el título, la
 * ciudad ni la banda dentro de una frase.
 * @param yo Si se da, esa fila se marca como «este evento» (ficha del evento).
 */
export function resumenChoque(
  c: Choque,
  opciones: { bandasVisibles?: Set<string>; yo?: { tipo: TipoEventoCalendario; id: string } } = {},
): ResumenChoque {
  const { bandasVisibles, yo } = opciones;
  const esYo = (e: EventoCalendario) => !!yo && e.id === yo.id && (e.tipo === 'concierto') === (yo.tipo === 'concierto');
  const variasBandas = c.a.bandId !== c.b.bandId;

  let tramo: TramoChoque | undefined;
  const { a, b } = c;
  if (a.inicio !== undefined && a.fin !== undefined && b.inicio !== undefined && b.fin !== undefined) {
    const ini = Math.max(a.inicio, b.inicio);
    const fin = Math.min(a.fin, b.fin);
    tramo = {
      desde: Math.min(a.inicio, b.inicio),
      hasta: Math.max(a.fin, b.fin),
      a: [a.inicio, a.fin],
      b: [b.inicio, b.fin],
      solape: fin > ini ? [ini, fin] : undefined,
    };
  }

  return {
    titular: titular(c, tramo?.solape ? tramo.solape[1] - tramo.solape[0] : undefined),
    filas: [fila(a, esYo(a), bandasVisibles, variasBandas), fila(b, esYo(b), bandasVisibles, variasBandas)],
    tramo,
  };
}
