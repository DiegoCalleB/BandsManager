/**
 * Campaña de cuenta atrás de un concierto: qué publicar y cuándo. Lógica pura, sin I/O, compartida
 * entre el cliente (pantalla «Promocionar») y el servidor (redacción con IA).
 *
 * Cuatro hitos (anuncio, recordatorio, última llamada y día D) que se adaptan a los días que faltan:
 * si el concierto está a 12 días no se inventa un «hace 3 semanas». Cada hito trae dos variantes de
 * texto ya escritas, así funciona sin IA y sin gastar créditos; la IA solo las reescribe si se pide.
 *
 * Nada se publica solo: el resultado son borradores que la banda revisa (AGENTS.md §3).
 */

export type HitoId = 'anuncio' | 'recordatorio' | 'ultima_llamada' | 'dia_d';

export interface Hito {
  id: HitoId;
  /** AAAA-MM-DD en que conviene publicar. */
  fecha: string;
  /** Días que faltan para el concierto desde esa fecha (0 = el propio día). */
  diasAntes: number;
  estado: 'hoy' | 'proximo';
  titulo: string;
  objetivo: string;
}

const MS_DIA = 86_400_000;

export function sumarDias(fechaIso: string, dias: number): string {
  const d = new Date(`${fechaIso}T12:00:00Z`);
  return new Date(d.getTime() + dias * MS_DIA).toISOString().slice(0, 10);
}

export function diasEntre(desdeIso: string, hastaIso: string): number {
  return Math.round((new Date(`${hastaIso}T12:00:00Z`).getTime() - new Date(`${desdeIso}T12:00:00Z`).getTime()) / MS_DIA);
}

const DEFINICION: Record<HitoId, { antes: number; titulo: string; objetivo: string }> = {
  anuncio: { antes: 21, titulo: 'Anuncio', objetivo: 'Que la gente apunte la fecha y sepa dónde comprar.' },
  recordatorio: { antes: 7, titulo: 'Recordatorio', objetivo: 'Quedan siete días: empuja a los que lo han dejado para luego.' },
  ultima_llamada: { antes: 1, titulo: 'Última llamada', objetivo: 'Mañana es el concierto: cierra las dudas de última hora.' },
  dia_d: { antes: 0, titulo: 'Día D', objetivo: 'Hoy tocamos: que nadie se quede sin saber dónde y a qué hora.' },
};

/**
 * Hitos que quedan por publicar. Devuelve [] si el concierto ya pasó. El anuncio, si ya no cabe en
 * su fecha ideal (faltan menos de 21 días), se hace HOY siempre que no caiga otro hito hoy y falten
 * al menos dos días: anunciar con un día de margen es la última llamada, no un anuncio.
 */
export function planificarCampana(fechaConcierto: string, hoy: string): Hito[] {
  const dias = diasEntre(hoy, fechaConcierto);
  if (!Number.isFinite(dias) || dias < 0) return [];

  const hitos: Hito[] = [];
  for (const id of ['anuncio', 'recordatorio', 'ultima_llamada', 'dia_d'] as HitoId[]) {
    const { antes, titulo, objetivo } = DEFINICION[id];
    const fecha = sumarDias(fechaConcierto, -antes);
    if (fecha >= hoy) hitos.push({ id, fecha, diasAntes: antes, estado: fecha === hoy ? 'hoy' : 'proximo', titulo, objetivo });
  }

  const anuncioPendiente = !hitos.some((h) => h.id === 'anuncio');
  const algoHoy = hitos.some((h) => h.fecha === hoy);
  if (anuncioPendiente && dias >= 2 && !algoHoy) {
    const { titulo, objetivo } = DEFINICION.anuncio;
    hitos.unshift({ id: 'anuncio', fecha: hoy, diasAntes: dias, estado: 'hoy', titulo, objetivo });
  }
  return hitos;
}

/* ------------------------------------------------------------------ textos */

export interface DatosPieza {
  banda: string;
  sala: string;
  ciudad: string;
  /** AAAA-MM-DD del concierto. */
  fecha: string;
  /** Enlace corto con atribución del canal; si falta, el texto sale sin enlace en vez de roto. */
  enlace?: string | null;
}

export function fechaCorta(fechaIso: string): string {
  return new Date(`${fechaIso}T12:00:00Z`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
}

const cola = (enlace: string | null | undefined, prefijo: string) => (enlace ? ` ${prefijo}${enlace}` : '');

type Plantilla = (d: DatosPieza & { cuando: string }) => string;

// Reglas de redacción (AGENTS.md §3, anti-tells): sin guiones largos, sin emojis, sin tríadas de
// adjetivos ni gerundios encadenados, frases cortas y vocabulario del circuito.
const PLANTILLAS: Record<HitoId, [Plantilla, Plantilla]> = {
  anuncio: [
    (d) => `${d.banda} toca en ${d.sala} (${d.ciudad}) el ${d.cuando}. Ya hay entradas.${cola(d.enlace, 'Aquí: ')}`,
    (d) => `Apunta la fecha: ${d.cuando}, ${d.sala}, ${d.ciudad}. Os esperamos.${cola(d.enlace, 'Entradas: ')}`,
  ],
  recordatorio: [
    (d) => `Queda una semana. ${d.cuando} en ${d.sala} (${d.ciudad}). Si aún no tienes entrada:${d.enlace ? ` ${d.enlace}` : ' escríbenos'}`,
    (d) => `Una semana para ${d.sala}. Trae a quien quieras.${cola(d.enlace, 'Entradas: ')}`,
  ],
  ultima_llamada: [
    (d) => `Mañana en ${d.sala} (${d.ciudad}). Últimas entradas.${cola(d.enlace, 'Aquí: ')}`,
    (d) => `Mañana tocamos en ${d.ciudad}. Si te lo estás pensando, este es el momento.${cola(d.enlace, '')}`,
  ],
  dia_d: [
    (d) => `Hoy en ${d.sala} (${d.ciudad}). Nos vemos esta noche.${cola(d.enlace, '')}`,
    (d) => `Es hoy. ${d.sala}, ${d.ciudad}. Quedan entradas hasta el último momento.${cola(d.enlace, 'Aquí: ')}`,
  ],
};

export function textoPieza(hito: HitoId, variante: 0 | 1, datos: DatosPieza): string {
  return PLANTILLAS[hito][variante]({ ...datos, cuando: fechaCorta(datos.fecha) }).replace(/\s+/g, ' ').trim();
}

export function variantesPieza(hito: HitoId, datos: DatosPieza): [string, string] {
  return [textoPieza(hito, 0, datos), textoPieza(hito, 1, datos)];
}

/** Hasta 3 etiquetas, solo con caracteres seguros: genérica, ciudad y banda. */
export function hashtagsCampana(ciudad: string, banda: string): string[] {
  const limpia = (t: string) =>
    t
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '')
      .slice(0, 30);
  const c = limpia(ciudad);
  const b = limpia(banda);
  return ['#musicaendirecto', c && `#${c.toLowerCase()}`, b && `#${b.toLowerCase()}`].filter(Boolean) as string[];
}

/* ------------------------------------------------------------------ salida de la IA */

const MAX_CARACTERES_PIEZA = 280;

/**
 * Valida y deja limpio un texto que ha escrito la IA. Es la barrera real: el modelo puede devolver
 * un enlace ajeno, hashtags, guiones largos o un testamento. Devuelve `null` si no se puede
 * aprovechar (el llamador cae entonces a las plantillas, que siempre funcionan).
 *  · el único enlace permitido es el nuestro y aparece exactamente una vez;
 *  · sin guiones largos (—, –), sin emojis y sin hashtags (los pone la app);
 *  · una sola línea y como mucho 280 caracteres.
 */
export function sanearVarianteIA(texto: unknown, enlace: string | null | undefined): string | null {
  if (typeof texto !== 'string') return null;
  let t = texto
    .trim()
    .replace(/^["'`«“]+|["'`»”]+$/g, '')
    .replace(/https?:\/\/\S+/gi, (url) => (enlace && url.replace(/[.,;:!?)]+$/, '') === enlace ? enlace : ''))
    .replace(/[—–]|--/g, ',')
    .replace(/\p{Extended_Pictographic}️?/gu, '')
    .replace(/#\p{L}[\p{L}\p{N}_]*/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/,\s*,/g, ',')
    .trim();

  if (enlace) {
    // Si el modelo repitió el enlace, se queda uno solo; si no lo puso, se añade al final.
    const partes = t.split(enlace);
    t = partes.length > 2 ? `${partes[0]}${enlace}${partes.slice(1).join('')}`.replace(/\s+/g, ' ').trim() : t;
    if (!t.includes(enlace)) t = `${t} ${enlace}`.trim();
  }
  if (!t || t.length > MAX_CARACTERES_PIEZA) return null;
  // Sin texto de verdad (solo el enlace o signos) no vale.
  if (t.replace(enlace || '', '').replace(/[^\p{L}\p{N}]/gu, '').length < 8) return null;
  return t;
}
