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
import { estimarViaje, mismaCiudad, resolverCiudad } from './viajeEstimado';

export type TipoEventoCalendario = 'concierto' | 'ensayo' | 'reunion' | 'otro';
export type SeveridadChoque = 'choque' | 'aviso';
export type MotivoChoque =
  | 'solape_horario'
  | 'mismo_dia'
  | 'margen_corto'
  /** No hay tiempo físico de llegar del primer sitio al segundo. */
  | 'viaje_inviable'
  /** Se llega, pero sin colchón para descargar y montar. */
  | 'viaje_justo'
  /** Mismo día, sin horas, y a muchas horas de distancia. */
  | 'distancia_dia';

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
  /** Minutos entre el fin del primero y el inicio del segundo (motivos con horas, sin solape). */
  margenMin?: number;
  /** Desplazamiento estimado entre los dos sitios (motivos de viaje). */
  viajeMin?: number;
  distanciaKm?: number;
}

export interface ContextoConflictos {
  /** Ids de usuario de cada banda. Sin esto no se evalúan choques entre bandas. */
  miembrosDe?: (bandId: string) => string[];
  /** Ignora los eventos anteriores a esta fecha (YYYY-MM-DD). */
  desde?: string;
  /** Margen mínimo (min) entre dos eventos del mismo día en sitios que no se pueden situar. */
  margenMinimoMin?: number;
  /** Sustituye la estimación por defecto de desplazamiento (p. ej. con datos de carretera reales). */
  tiempoViajeMin?: (origen: string, destino: string) => { minutos: number; km: number } | null;
}

const DURACION_ENSAYO_DEFECTO_MIN = 120;
const DURACION_BOLO_DEFECTO_MIN = 90;
const MARGEN_MINIMO_DEFECTO_MIN = 60;
/** Tras llegar: descargar, montar y cambiarse. Con menos colchón que esto se avisa de "muy justo". */
const COLCHON_LLEGADA_MIN = 45;
/** Sin horas, a partir de aquí el mismo día en dos ciudades ya merece un aviso. */
const DISTANCIA_DIA_AVISO_MIN = 180;

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
    // Los ensayos no tienen ciudad: se deduce del lugar solo si es una ciudad que conocemos
    ciudad: resolverCiudad(r.lugar) ? r.lugar : undefined,
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

const diaNumero = (fecha: string): number => {
  const [y, m, d] = fecha.split('-').map(Number);
  return Math.floor(Date.UTC(y, (m || 1) - 1, d || 1) / 86_400_000);
};

/** Minutos absolutos (desde el día 0), para comparar eventos de días distintos. */
const absInicio = (e: EventoCalendario) => diaNumero(e.fecha) * 1440 + e.inicio!;
const absFin = (e: EventoCalendario) => diaNumero(e.fecha) * 1440 + e.fin!;

function haySolape(a: EventoCalendario, b: EventoCalendario): boolean {
  return absInicio(a) < absFin(b) && absInicio(b) < absFin(a);
}

function viajeEntre(a: EventoCalendario, b: EventoCalendario, ctx: ContextoConflictos) {
  if (!a.ciudad || !b.ciudad) return null;
  // Misma ciudad (o alias de ella): se asume el mismo entorno, no se avisa de viaje
  if (mismaCiudad(a.ciudad, b.ciudad) === true) return null;
  const v = ctx.tiempoViajeMin ? ctx.tiempoViajeMin(a.ciudad, b.ciudad) : estimarViaje(a.ciudad, b.ciudad);
  if (!v) return null;
  return 'minutos' in v ? { minutos: v.minutos, km: v.km } : null;
}

function mismoSitio(a: EventoCalendario, b: EventoCalendario): boolean {
  if (!a.ciudad || !b.ciudad) return false;
  const misma = mismaCiudad(a.ciudad, b.ciudad);
  return misma === null ? a.ciudad.trim().toLowerCase() === b.ciudad.trim().toLowerCase() : misma;
}

function huellaDe(a: EventoCalendario, b: EventoCalendario, motivo: MotivoChoque): string {
  const parte = (e: EventoCalendario) => `${e.tipo}:${e.id}@${e.fecha}/${e.inicio ?? '-'}-${e.fin ?? '-'}`;
  const [x, y] = [parte(a), parte(b)].sort();
  return `${motivo}|${x}|${y}`;
}

function evaluarPar(x: EventoCalendario, y: EventoCalendario, ctx: ContextoConflictos): Choque | null {
  if (Math.abs(diaNumero(x.fecha) - diaNumero(y.fecha)) > 1) return null;

  const entreBandas = x.bandId !== y.bandId;
  if (entreBandas && !ctx.miembrosDe) return null;

  // Sin personas en común no hay choque, por mucho que coincidan en hora.
  const pa = participantes(x, ctx);
  const pb = participantes(y, ctx);
  // Entre bandas hay que conocer a los dos lados: "toda la banda" sin lista de miembros
  // inventaría choques con cualquiera que aparezca en la otra.
  if (entreBandas && (pa === null || pb === null)) return null;
  const comunes = interseccion(pa, pb);
  if (comunes !== null && comunes.size === 0) return null;

  const personas = comunes ? [...comunes].sort() : [];
  const conHora = [x, y].every((e) => e.inicio !== undefined && e.fin !== undefined);
  const mismoDia = x.fecha === y.fecha;
  const provisional = x.provisional || y.provisional;

  // `a` es siempre el que empieza antes (o el primero de la lista si no hay horas)
  const [a, b] = conHora && absInicio(y) < absInicio(x) ? [y, x] : [x, y];
  const base = { personas, entreBandas, fecha: a.fecha <= b.fecha ? a.fecha : b.fecha };
  const choque = (severidad: SeveridadChoque, motivo: MotivoChoque, extra: Partial<Choque> = {}): Choque => ({
    huella: huellaDe(a, b, motivo),
    severidad,
    motivo,
    a,
    b,
    ...base,
    ...extra,
  });

  if (conHora) {
    if (haySolape(a, b)) return choque(provisional ? 'aviso' : 'choque', 'solape_horario');

    const margen = absInicio(b) - absFin(a);
    const viaje = viajeEntre(a, b, ctx);

    if (viaje) {
      const datos = { margenMin: margen, viajeMin: viaje.minutos, distanciaKm: viaje.km };
      if (margen < viaje.minutos) return choque(provisional ? 'aviso' : 'choque', 'viaje_inviable', datos);
      if (margen < viaje.minutos + COLCHON_LLEGADA_MIN) return choque('aviso', 'viaje_justo', datos);
      return null;
    }

    // Sin poder situar uno de los dos sitios: solo el mismo día, con un margen plano
    const minimo = ctx.margenMinimoMin ?? MARGEN_MINIMO_DEFECTO_MIN;
    if (!mismoDia || margen >= minimo || mismoSitio(a, b)) return null;
    return choque('aviso', 'margen_corto', { margenMin: margen });
  }

  // Sin horas solo tiene sentido hablar del mismo día
  if (!mismoDia) return null;

  // Dos bolos el mismo día sin horas: casi seguro imposible. Cualquier otra mezcla: solo aviso.
  if (a.tipo === 'concierto' && b.tipo === 'concierto' && !provisional) return choque('choque', 'mismo_dia');

  const viaje = viajeEntre(a, b, ctx);
  if (viaje && viaje.minutos >= DISTANCIA_DIA_AVISO_MIN) {
    return choque('aviso', 'distancia_dia', { viajeMin: viaje.minutos, distanciaKm: viaje.km });
  }
  return choque('aviso', 'mismo_dia');
}

export function detectarChoques(eventos: EventoCalendario[], ctx: ContextoConflictos = {}): Choque[] {
  const vistos = new Set<string>();
  const orden = eventos
    .filter((e) => e.fecha && (!ctx.desde || e.fecha >= ctx.desde))
    .map((e) => ({ e, dia: diaNumero(e.fecha) }))
    .sort((p, q) => p.dia - q.dia);

  const out: Choque[] = [];
  for (let i = 0; i < orden.length; i++) {
    for (let j = i + 1; j < orden.length; j++) {
      // Solo importan el mismo día y el siguiente (un bolo de madrugada, el viaje de vuelta)
      if (orden[j].dia - orden[i].dia > 1) break;
      const [p, q] = [orden[i].e, orden[j].e];
      // El mismo evento puede llegar duplicado (vista "Todos" + banda activa)
      if (p.id === q.id && p.tipo === q.tipo) continue;
      const c = evaluarPar(p, q, ctx);
      if (c && !vistos.has(c.huella)) {
        vistos.add(c.huella);
        out.push(c);
      }
    }
  }

  return out.sort(
    (x, y) =>
      x.fecha.localeCompare(y.fecha) ||
      (x.severidad === y.severidad ? 0 : x.severidad === 'choque' ? -1 : 1),
  );
}

/** Peor severidad de cada día afectado (YYYY-MM-DD → 'choque' | 'aviso'), para marcar el calendario. */
export function peorSeveridadPorDia(choques: Choque[]): Record<string, SeveridadChoque> {
  const out: Record<string, SeveridadChoque> = {};
  for (const c of choques) {
    for (const dia of new Set([c.a.fecha, c.b.fecha])) {
      if (out[dia] !== 'choque') out[dia] = c.severidad;
    }
  }
  return out;
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
  const lugar = ev.ciudad && !ev.titulo.toLowerCase().includes(ev.ciudad.toLowerCase()) ? ` en ${ev.ciudad}` : '';
  return `${ETIQUETA_TIPO[ev.tipo]} «${ev.titulo}»${lugar}${banda}${hora}`;
}

function duracion(min?: number): string {
  if (min === undefined) return '';
  const h = Math.floor(Math.abs(min) / 60);
  const m = Math.round(Math.abs(min) % 60);
  return h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function describirChoque(c: Choque, bandasVisibles?: Set<string>): string {
  const a = describirEvento(c.a, bandasVisibles);
  const b = describirEvento(c.b, bandasVisibles);
  const viaje = c.viajeMin !== undefined ? duracion(c.viajeMin) : null;
  switch (c.motivo) {
    case 'solape_horario':
      return `Se pisan: ${a} y ${b}.`;
    case 'margen_corto':
      return `Solo ${duracion(c.margenMin)} entre ${a} y ${b}, en sitios distintos.`;
    case 'viaje_inviable':
      return viaje
        ? `No da tiempo: entre ${a} y ${b} hay ${duracion(c.margenMin)} y solo el viaje son unas ${viaje}.`
        : `No da tiempo a llegar de ${a} a ${b}.`;
    case 'viaje_justo':
      return viaje
        ? `Muy justo: ${duracion(c.margenMin)} entre ${a} y ${b}, con unas ${viaje} de viaje y sin tiempo para montar.`
        : `Muy justo para llegar de ${a} a ${b}.`;
    case 'distancia_dia':
      return viaje
        ? `Mismo día y a unas ${viaje} de viaje: ${a} y ${b}.`
        : `Mismo día y en ciudades lejanas: ${a} y ${b}.`;
    default:
      return `Mismo día, sin horas que lo descarten: ${a} y ${b}.`;
  }
}

/**
 * El choque contado desde el punto de vista de UN evento ("se pisa con…", "vienes de…"),
 * para la ficha de ese evento. `null` si el choque no le afecta.
 */
export function describirDesdeEvento(
  c: Choque,
  tipo: TipoEventoCalendario,
  id: string,
  bandasVisibles?: Set<string>,
): string | null {
  const esConcierto = tipo === 'concierto';
  const es = (e: EventoCalendario) => e.id === id && (e.tipo === 'concierto') === esConcierto;
  const yoEsA = es(c.a);
  if (!yoEsA && !es(c.b)) return null;

  const otro = describirEvento(yoEsA ? c.b : c.a, bandasVisibles);
  // `a` es el que empieza antes: si yo soy `b`, vengo de `a`
  const vengoDeOtro = !yoEsA;
  const margen = duracion(c.margenMin);
  const viaje = c.viajeMin !== undefined ? duracion(c.viajeMin) : null;

  switch (c.motivo) {
    case 'solape_horario':
      return `Se pisa con ${otro}.`;
    case 'margen_corto':
      return `Muy poco margen (${margen}) con ${otro}, en sitios distintos.`;
    case 'viaje_inviable':
      if (!viaje) return vengoDeOtro ? `No da tiempo a llegar desde ${otro}.` : `No da tiempo a llegar a ${otro}.`;
      return vengoDeOtro
        ? `No da tiempo: vienes de ${otro}, hay ${margen} y solo el viaje son unas ${viaje}.`
        : `No da tiempo: después tienes ${otro}, hay ${margen} y solo el viaje son unas ${viaje}.`;
    case 'viaje_justo':
      if (!viaje) return `Muy justo con ${otro}.`;
      return vengoDeOtro
        ? `Muy justo: vienes de ${otro}, con ${margen} de margen y unas ${viaje} de viaje, sin tiempo para montar.`
        : `Muy justo: después tienes ${otro}, con ${margen} de margen y unas ${viaje} de viaje.`;
    case 'distancia_dia':
      return viaje ? `Mismo día que ${otro}, a unas ${viaje} de viaje.` : `Mismo día que ${otro}, en ciudades lejanas.`;
    default:
      return `Mismo día que ${otro}, sin horas que lo descarten.`;
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
  const hayOculto = !bandasVisibles.has(c.a.bandId) || !bandasVisibles.has(c.b.bandId);
  // Tiempo y distancia de viaje delatarían dónde toca la otra banda
  const sinViaje = hayOculto ? { viajeMin: undefined, distanciaKm: undefined, margenMin: undefined } : {};
  return { ...c, ...sinViaje, a: ocultar(c.a), b: ocultar(c.b) };
}
