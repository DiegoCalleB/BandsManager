/**
 * Detector de choques de calendario (conciertos, ensayos y reuniones).
 *
 * Función pura y compartida: la usa el cliente para pintar el aviso al instante y el servidor
 * para decidir a quién se le manda el email. Sin red, sin base de datos, sin `Date.now()`.
 *
 * Un choque solo existe si hay una PERSONA en los dos sitios a la vez:
 *  - misma banda: la intersección de convocados (una convocatoria `parcial` con músicos
 *    distintos no choca; una `completa` convoca a toda la banda);
 *  - bandas distintas: solo los músicos que están en las dos.
 */

import type { Concert, Rehearsal } from '../types';

export type TipoEventoCalendario = 'concierto' | 'ensayo' | 'reunion' | 'otro';
export type SeveridadChoque = 'choque' | 'aviso';
export type MotivoChoque = 'solape_horario' | 'mismo_dia' | 'margen_corto';

export interface EventoCalendario {
  id: string;
  tipo: TipoEventoCalendario;
  bandId: string;
  bandName?: string;
  titulo: string;
  ciudad?: string;
  /** YYYY-MM-DD */
  fecha: string;
  /** Minutos desde medianoche. Ausentes si el evento no tiene hora conocida. */
  inicio?: number;
  fin?: number;
  /** Bolo "posible" (sin confirmar): nunca genera un choque duro. */
  provisional: boolean;
  /** Ids de usuario convocados; `null` = toda la banda. */
  convocados: string[] | null;
}

export interface Choque {
  /** Estable mientras no cambien eventos, fecha ni horas: sirve para no avisar dos veces. */
  huella: string;
  severidad: SeveridadChoque;
  motivo: MotivoChoque;
  fecha: string;
  a: EventoCalendario;
  b: EventoCalendario;
  /** Ids de usuario que están en los dos eventos. Vacío = no se pudo resolver (toda la banda). */
  personas: string[];
  entreBandas: boolean;
  /** Minutos entre el fin de uno y el inicio del otro (solo `margen_corto`). */
  margenMin?: number;
}

export interface ContextoConflictos {
  /** Ids de usuario de cada banda. Sin esto no se evalúan choques entre bandas. */
  miembrosDe?: (bandId: string) => string[];
  /** Ignora los eventos anteriores a esta fecha (YYYY-MM-DD). */
  desde?: string;
  /** Margen mínimo (min) entre dos eventos del mismo día en sitios distintos. */
  margenMinimoMin?: number;
}

const DURACION_ENSAYO_DEFECTO_MIN = 120;
const DURACION_BOLO_DEFECTO_MIN = 90;
const MARGEN_MINIMO_DEFECTO_MIN = 60;

/** Todas las horas de un texto libre: "18:00 - 21:00", "19.30", "20h". */
export function extraerMinutos(texto?: string | null): number[] {
  if (!texto) return [];
  const out: number[] = [];
  for (const m of texto.matchAll(/(\d{1,2})(?:\s*[:.]\s*(\d{2})|\s*h(?:\s*(\d{2}))?)?/gi)) {
    const h = Number(m[1]);
    const min = Number(m[2] ?? m[3] ?? 0);
    // Un "5" suelto ("5 músicos") no es una hora: exige minutos, una "h" o dos dígitos
    if (m[2] === undefined && !/h/i.test(m[0]) && m[1].length < 2) continue;
    if (h > 23 || min > 59) continue;
    out.push(h * 60 + min);
  }
  return out;
}

function fechaDia(fecha?: string | null): string {
  return (fecha || '').split('T')[0].trim();
}

function esProvisional(c: Concert): boolean {
  return c.is_posible === true || c.tipo === 'posible';
}

export function conciertoAEvento(c: Concert, bandId: string): EventoCalendario {
  const lt = c.logisticaTecnica;
  const inicio = extraerMinutos(lt?.horaLlegada)[0] ?? extraerMinutos(lt?.horaPruebaSonido)[0] ?? extraerMinutos(lt?.horaShow)[0];
  let fin = extraerMinutos(lt?.horaCierreToque)[0];
  if (fin === undefined) {
    const show = extraerMinutos(lt?.horaShow)[0];
    if (show !== undefined) fin = show + DURACION_BOLO_DEFECTO_MIN;
  }
  if (inicio !== undefined && fin !== undefined && fin <= inicio) fin += 24 * 60;
  return {
    id: c.id,
    tipo: 'concierto',
    bandId,
    bandName: c.bandName,
    titulo: c.sala || 'Concierto',
    ciudad: c.ciudad,
    fecha: fechaDia(c.fecha),
    inicio,
    fin: inicio !== undefined ? fin ?? inicio + DURACION_BOLO_DEFECTO_MIN : undefined,
    provisional: esProvisional(c),
    convocados: c.convocatoria_tipo === 'parcial' && c.convocados_ids?.length ? c.convocados_ids : null,
  };
}

/** Devuelve `null` si el ensayo está cancelado (no ocupa a nadie). */
export function ensayoAEvento(r: Rehearsal, bandId: string): EventoCalendario | null {
  if (r.estado === 'cancelado') return null;
  const horas = extraerMinutos(r.hora);
  const inicio = horas[0];
  let fin = extraerMinutos(r.horaFin)[0] ?? horas[1];
  if (inicio !== undefined && fin === undefined) {
    fin = inicio + (r.duracionEstimadaMin && r.duracionEstimadaMin > 0 ? r.duracionEstimadaMin : DURACION_ENSAYO_DEFECTO_MIN);
  }
  if (inicio !== undefined && fin !== undefined && fin <= inicio) fin += 24 * 60;
  return {
    id: r.id,
    tipo: r.tipo_evento === 'reunion' ? 'reunion' : r.tipo_evento === 'otro' ? 'otro' : 'ensayo',
    bandId,
    bandName: r.bandName,
    titulo: r.asunto || r.lugar || 'Ensayo',
    fecha: fechaDia(r.fecha),
    inicio,
    fin,
    provisional: false,
    convocados: r.convocatoria_tipo === 'parcial' && r.convocados_ids?.length ? r.convocados_ids : null,
  };
}

/** Construye la lista unificada. `bandIdDe` resuelve la banda de un evento sin `band_id`. */
export function construirEventos(
  concerts: Concert[],
  rehearsals: Rehearsal[],
  bandIdPorDefecto: string,
): EventoCalendario[] {
  const out: EventoCalendario[] = [];
  for (const c of concerts) {
    if (!fechaDia(c.fecha)) continue;
    out.push(conciertoAEvento(c, c.band_id || bandIdPorDefecto));
  }
  for (const r of rehearsals) {
    if (!fechaDia(r.fecha)) continue;
    const ev = ensayoAEvento(r, r.band_id || bandIdPorDefecto);
    if (ev) out.push(ev);
  }
  return out;
}

/** Quién está realmente convocado. `null` = no se puede resolver (se asume toda la banda). */
function participantes(ev: EventoCalendario, ctx: ContextoConflictos): Set<string> | null {
  if (ev.convocados) return new Set(ev.convocados);
  const miembros = ctx.miembrosDe?.(ev.bandId);
  return miembros && miembros.length > 0 ? new Set(miembros) : null;
}

function interseccion(a: Set<string> | null, b: Set<string> | null): Set<string> | null {
  if (a === null) return b;
  if (b === null) return a;
  return new Set([...a].filter((x) => b.has(x)));
}

function haySolape(a: EventoCalendario, b: EventoCalendario): boolean {
  return a.inicio! < b.fin! && b.inicio! < a.fin!;
}

function mismoSitio(a: EventoCalendario, b: EventoCalendario): boolean {
  const ca = (a.ciudad || '').trim().toLowerCase();
  const cb = (b.ciudad || '').trim().toLowerCase();
  if (ca && cb) return ca === cb;
  // Sin ciudad en alguno (los ensayos no la llevan): no se puede asegurar que sea el mismo sitio.
  return false;
}

function huellaDe(a: EventoCalendario, b: EventoCalendario, motivo: MotivoChoque): string {
  const parte = (e: EventoCalendario) => `${e.tipo}:${e.id}@${e.inicio ?? '-'}-${e.fin ?? '-'}`;
  const [x, y] = [parte(a), parte(b)].sort();
  return `${a.fecha}|${motivo}|${x}|${y}`;
}

function evaluarPar(a: EventoCalendario, b: EventoCalendario, ctx: ContextoConflictos): Choque | null {
  if (a.fecha !== b.fecha) return null;

  const entreBandas = a.bandId !== b.bandId;
  if (entreBandas && !ctx.miembrosDe) return null;

  // Sin personas en común no hay choque, por mucho que coincidan en hora.
  const pa = participantes(a, ctx);
  const pb = participantes(b, ctx);
  // Entre bandas hay que conocer a los dos lados: "toda la banda" sin lista de miembros
  // inventaría choques con cualquiera que aparezca en la otra.
  if (entreBandas && (pa === null || pb === null)) return null;
  const comunes = interseccion(pa, pb);
  if (comunes !== null && comunes.size === 0) return null;

  const personas = comunes ? [...comunes].sort() : [];
  const conHora = a.inicio !== undefined && a.fin !== undefined && b.inicio !== undefined && b.fin !== undefined;
  const provisional = a.provisional || b.provisional;

  let severidad: SeveridadChoque;
  let motivo: MotivoChoque;
  let margenMin: number | undefined;

  if (conHora) {
    if (haySolape(a, b)) {
      motivo = 'solape_horario';
      severidad = provisional ? 'aviso' : 'choque';
    } else {
      const margen = a.inicio! >= b.fin! ? a.inicio! - b.fin! : b.inicio! - a.fin!;
      const minimo = ctx.margenMinimoMin ?? MARGEN_MINIMO_DEFECTO_MIN;
      if (margen >= minimo || mismoSitio(a, b)) return null;
      motivo = 'margen_corto';
      severidad = 'aviso';
      margenMin = margen;
    }
  } else {
    motivo = 'mismo_dia';
    // Dos bolos el mismo día sin horas: casi seguro imposible. Cualquier otra mezcla: solo aviso.
    severidad = a.tipo === 'concierto' && b.tipo === 'concierto' && !provisional ? 'choque' : 'aviso';
  }

  return { huella: huellaDe(a, b, motivo), severidad, motivo, fecha: a.fecha, a, b, personas, entreBandas, margenMin };
}

export function detectarChoques(eventos: EventoCalendario[], ctx: ContextoConflictos = {}): Choque[] {
  const vistos = new Set<string>();
  const utiles = eventos.filter((e) => e.fecha && (!ctx.desde || e.fecha >= ctx.desde));

  const porDia = new Map<string, EventoCalendario[]>();
  for (const e of utiles) {
    const lista = porDia.get(e.fecha);
    if (lista) lista.push(e);
    else porDia.set(e.fecha, [e]);
  }

  const out: Choque[] = [];
  for (const lista of porDia.values()) {
    for (let i = 0; i < lista.length; i++) {
      for (let j = i + 1; j < lista.length; j++) {
        // El mismo evento puede llegar duplicado (vista "Todos" + banda activa)
        if (lista[i].id === lista[j].id && lista[i].tipo === lista[j].tipo) continue;
        const c = evaluarPar(lista[i], lista[j], ctx);
        if (c && !vistos.has(c.huella)) {
          vistos.add(c.huella);
          out.push(c);
        }
      }
    }
  }

  return out.sort(
    (x, y) =>
      x.fecha.localeCompare(y.fecha) ||
      (x.severidad === y.severidad ? 0 : x.severidad === 'choque' ? -1 : 1),
  );
}

/** Choques en los que participa un evento concreto (para el aviso al guardarlo). */
export function choquesDeEvento(choques: Choque[], tipo: TipoEventoCalendario, id: string): Choque[] {
  const esConcierto = tipo === 'concierto';
  const coincide = (e: EventoCalendario) => e.id === id && (e.tipo === 'concierto') === esConcierto;
  return choques.filter((c) => coincide(c.a) || coincide(c.b));
}

function hhmm(min?: number): string {
  if (min === undefined) return '';
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

const ETIQUETA_TIPO: Record<TipoEventoCalendario, string> = {
  concierto: 'concierto',
  ensayo: 'ensayo',
  reunion: 'reunión',
  otro: 'evento',
};

/**
 * Descripción legible de un evento. Si `bandasVisibles` no incluye su banda, se oculta todo
 * salvo "otro compromiso": un músico en dos bandas ve las dos, pero el líder de una no debe
 * enterarse de dónde toca la otra (AGENTS.md §2.1).
 */
export function describirEvento(ev: EventoCalendario, bandasVisibles?: Set<string>): string {
  if (bandasVisibles && !bandasVisibles.has(ev.bandId)) return 'otro compromiso en otra banda';
  const hora = ev.inicio !== undefined ? ` (${hhmm(ev.inicio)}${ev.fin !== undefined ? `–${hhmm(ev.fin)}` : ''})` : '';
  const banda = ev.bandName ? ` de ${ev.bandName}` : '';
  return `${ETIQUETA_TIPO[ev.tipo]} «${ev.titulo}»${banda}${hora}`;
}

export function describirChoque(c: Choque, bandasVisibles?: Set<string>): string {
  const a = describirEvento(c.a, bandasVisibles);
  const b = describirEvento(c.b, bandasVisibles);
  switch (c.motivo) {
    case 'solape_horario':
      return `Se pisan: ${a} y ${b}.`;
    case 'margen_corto':
      return `Solo ${c.margenMin} min entre ${a} y ${b}, en sitios distintos.`;
    default:
      return `Mismo día, sin horas que lo descarten: ${a} y ${b}.`;
  }
}

/**
 * Copia del choque apta para enviarse a alguien que NO pertenece a todas las bandas implicadas:
 * los eventos de bandas ajenas quedan reducidos a "otro compromiso" (sin sala, ciudad, banda,
 * id ni hora). Hay que hacerlo en el dato, no solo en el texto: el JSON llega al navegador.
 */
export function redactarChoque(c: Choque, bandasVisibles: Set<string>): Choque {
  const ocultar = (e: EventoCalendario): EventoCalendario =>
    bandasVisibles.has(e.bandId)
      ? e
      : {
          id: `oculto-${e.tipo}`,
          tipo: e.tipo,
          bandId: 'oculta',
          titulo: 'Otro compromiso en otra banda',
          fecha: e.fecha,
          provisional: e.provisional,
          convocados: null,
        };
  return { ...c, a: ocultar(c.a), b: ocultar(c.b) };
}
