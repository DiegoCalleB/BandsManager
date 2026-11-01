/**
 * El calendario del asesor: una agenda de tres semanas (la pasada y las dos próximas) con lo que
 * ya está fijado (bolos, hitos de su campaña, lanzamiento) y lo que la banda ya publicó, con la
 * lectura de sus números si los hay. Lógica pura y sin IA: no inventa publicaciones futuras, solo
 * pone en fila lo que se sabe. Qué publicar cada día sigue decidiéndolo `opcionesDeHoy`.
 */
import { diasEntre, planificarCampana, sumarDias } from '../campanaConcierto';
import type { Veredicto } from './diagnosticoMetricas';
import { lecturaRelativa, previasDe, type EstadoLectura, type ResultadoRed } from './metricasPorRed';
import type { ConciertoParaAsesor } from './diagnostico';
import type { Lanzamiento } from './estrategia';
import type { ResultadoPieza } from './resumen';
import { lecturaDe, tituloDe } from './resumen';
import type { Formato } from './reglasFormato';
import type { AccionRegistrada } from './tipos';

export const DIAS_ATRAS = 7;
export const DIAS_ADELANTE = 14;

export type EventoAgenda =
  | { tipo: 'bolo'; texto: string }
  | { tipo: 'hito'; texto: string; objetivo: string }
  | { tipo: 'lanzamiento'; texto: string }
  | { tipo: 'hecha'; texto: string; formato: Formato; lectura: Veredicto | EstadoLectura | 'sin_medir' };

export interface DiaAgenda {
  fecha: string;
  esHoy: boolean;
  eventos: EventoAgenda[];
}

export interface EntradaAgenda {
  hoy: string;
  conciertos: ConciertoParaAsesor[];
  lanzamiento: Lanzamiento | null;
  historial: AccionRegistrada[];
  resultados: ResultadoPieza[];
  /** Resultados de TikTok y YouTube: si la pieza solo se midió allí, la lectura sale de compararla con lo habitual de esa red. */
  resultadosRed?: ResultadoRed[];
}

const donde = (c: ConciertoParaAsesor) => [c.sala, c.ciudad].filter(Boolean).join(', ');

/** Solo los días con algo que contar, y siempre hoy, para que la banda se sitúe. */
export function agendaDe({ hoy, conciertos, lanzamiento, historial, resultados, resultadosRed = [] }: EntradaAgenda): DiaAgenda[] {
  const desde = sumarDias(hoy, -DIAS_ATRAS);
  const hasta = sumarDias(hoy, DIAS_ADELANTE);
  const dentro = (f: string) => f >= desde && f <= hasta;
  const porDia = new Map<string, EventoAgenda[]>();
  const poner = (fecha: string, e: EventoAgenda) => {
    if (dentro(fecha)) porDia.set(fecha, [...(porDia.get(fecha) ?? []), e]);
  };

  for (const c of conciertos) {
    if (!Number.isFinite(diasEntre(desde, c.fecha))) continue;
    poner(c.fecha, { tipo: 'bolo', texto: donde(c) ? `Concierto en ${donde(c)}` : 'Concierto' });
    // Los hitos de la campaña solo existen hacia delante: el pasado ya no se puede preparar.
    for (const h of planificarCampana(c.fecha, hoy)) poner(h.fecha, { tipo: 'hito', texto: `${h.titulo} del bolo${c.sala ? ` en ${c.sala}` : ''}`, objetivo: h.objetivo });
  }
  if (lanzamiento && Number.isFinite(diasEntre(desde, lanzamiento.fecha))) poner(lanzamiento.fecha, { tipo: 'lanzamiento', texto: `Sale «${lanzamiento.titulo}»` });

  for (const a of historial) {
    if (a.accion !== 'hecho') continue;
    const r = resultados.find((x) => x.fecha === a.fecha && x.tarjetaId === a.tarjetaId);
    const rr = r ? undefined : resultadosRed.find((x) => x.fecha === a.fecha && x.tarjetaId === a.tarjetaId);
    const lectura = r ? lecturaDe(r).veredicto : rr ? lecturaRelativa(rr.red, rr.metricas, previasDe(resultadosRed, rr, hoy)).estado : 'sin_medir';
    poner(a.fecha, { tipo: 'hecha', texto: tituloDe(a), formato: a.formato, lectura });
  }

  const dias: DiaAgenda[] = [];
  for (let i = -DIAS_ATRAS; i <= DIAS_ADELANTE; i++) {
    const fecha = sumarDias(hoy, i);
    const eventos = porDia.get(fecha) ?? [];
    if (eventos.length || fecha === hoy) dias.push({ fecha, esHoy: fecha === hoy, eventos });
  }
  return dias;
}
