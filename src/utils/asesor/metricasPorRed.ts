/**
 * Resultados de una pieza en TikTok y YouTube Shorts. Instagram tiene sus propios números y sus
 * umbrales del temario (`resumen.ts` y `diagnosticoMetricas.ts`); aquí cada red mide lo suyo:
 * TikTok da visualizaciones, favoritos y el porcentaje que ve el vídeo entero; YouTube no tiene
 * «guardados» y mide cuántos se quedan a verlo y cuánto ven.
 *
 * El temario no da umbrales para estas redes, así que no se inventan: la lectura compara la pieza
 * con la mediana de la propia banda en esa red. Lógica pura, compartida entre cliente y servidor.
 */
import { diasEntre } from '../campanaConcierto';
import { ALCANCE_MINIMO } from './diagnosticoMetricas';
import type { Formato, Red } from './reglasFormato';
import { DIAS_MAXIMOS_PARA_MEDIR, DIAS_PARA_MEDIR, tituloDe } from './resumen';
import type { AccionRegistrada } from './tipos';

export type RedExtra = Exclude<Red, 'instagram'>;
export const REDES_EXTRA: readonly RedExtra[] = ['tiktok', 'youtube'];

export const ETIQUETA_RED_METRICAS: Record<RedExtra, string> = { tiktok: 'TikTok', youtube: 'YouTube Shorts' };

export interface CampoMetrica {
  id: string;
  etiqueta: string;
  /** Dónde se ve ese número en la app de la red. */
  ayuda: string;
  tipo: 'entero' | 'porcentaje';
  obligatorio: boolean;
}

/** Lo que se anota de cada red, con el nombre que tiene en su propia app para que se encuentre a la primera. */
export const CAMPOS: Record<RedExtra, CampoMetrica[]> = {
  tiktok: [
    { id: 'visualizaciones', etiqueta: 'Visualizaciones', ayuda: 'En las analíticas del vídeo, pestaña Resumen.', tipo: 'entero', obligatorio: true },
    { id: 'guardados', etiqueta: 'Guardados', ayuda: 'Los «añadidos a favoritos».', tipo: 'entero', obligatorio: false },
    { id: 'compartidos', etiqueta: 'Compartidos', ayuda: 'En las analíticas del vídeo.', tipo: 'entero', obligatorio: false },
    { id: 'pctCompleto', etiqueta: 'Lo vieron entero (%)', ayuda: '«Vídeo visto completo», en las analíticas.', tipo: 'porcentaje', obligatorio: false },
  ],
  youtube: [
    { id: 'visualizaciones', etiqueta: 'Vistas', ayuda: 'En YouTube Studio, analíticas del Short.', tipo: 'entero', obligatorio: true },
    { id: 'pctQuedaron', etiqueta: 'Se quedaron a verlo (%)', ayuda: '«Visto» frente a «deslizado», en YouTube Studio.', tipo: 'porcentaje', obligatorio: false },
    { id: 'pctMedioVisto', etiqueta: 'Porcentaje medio visto (%)', ayuda: 'En la pestaña de retención de YouTube Studio.', tipo: 'porcentaje', obligatorio: false },
    { id: 'suscriptores', etiqueta: 'Suscriptores ganados', ayuda: 'En YouTube Studio, analíticas del Short.', tipo: 'entero', obligatorio: false },
  ],
};

/** Lo anotado de una pieza en una red: un número por campo, o null si no se anotó. */
export type MetricasRed = Record<string, number | null>;

const MAX_METRICA = 1_000_000_000;

function numero(v: unknown, tipo: CampoMetrica['tipo']): number | null | 'mal' {
  if (v === undefined || v === null || v === '') return null;
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : v;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return 'mal';
  if (tipo === 'entero') return Number.isInteger(n) && n <= MAX_METRICA ? n : 'mal';
  return n <= 100 ? Math.round(n * 10) / 10 : 'mal';
}

/** Lo que la banda escribe, validado: solo los campos de esa red (lo demás se ignora) o el motivo en una frase. */
export function sanearMetricasRed(red: RedExtra, raw: unknown): MetricasRed | string {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const metricas: MetricasRed = {};
  for (const campo of CAMPOS[red]) {
    const v = numero(o[campo.id], campo.tipo);
    if (v === 'mal') return campo.tipo === 'entero' ? `${campo.etiqueta}: escribe un número entero, sin decimales.` : `${campo.etiqueta}: escribe un porcentaje entre 0 y 100.`;
    if (v === null && campo.obligatorio) return `Escribe ${campo.etiqueta.toLowerCase()} (un número entero, mayor que 0).`;
    if (campo.obligatorio && v !== null && v < 1) return `Escribe ${campo.etiqueta.toLowerCase()} (un número entero, mayor que 0).`;
    metricas[campo.id] = v;
  }
  const vistas = metricas.visualizaciones as number;
  if (metricas.guardados !== undefined && metricas.guardados !== null && metricas.guardados > vistas) return 'No pueden haberlo guardado más personas de las que lo han visto.';
  if (metricas.compartidos !== undefined && metricas.compartidos !== null && metricas.compartidos > vistas) return 'No pueden haberlo compartido más personas de las que lo han visto.';
  return metricas;
}

/* ----------------------------------------------------------------- lectura */

export type EstadoLectura = 'sin_comparar' | 'por_encima' | 'en_su_linea' | 'por_debajo';
export interface Lectura {
  estado: EstadoLectura;
  mensaje: string;
  /** Cuántas veces la mediana de la banda, o null si no se pudo comparar. */
  veces: number | null;
}

/** Con menos piezas que esto no hay «lo habitual» con qué comparar. */
export const MIN_PREVIAS = 3;
/** Criterio propio, sin umbral de temario: ±50 % sobre lo habitual cuenta como distinto. */
export const UMBRAL_ALTO = 1.5;
export const UMBRAL_BAJO = 0.67;
/** Ventana de «lo habitual», en días. */
export const DIAS_HABITUAL = 28;

const mediana = (n: number[]) => {
  const o = [...n].sort((a, b) => a - b);
  return o.length % 2 ? o[(o.length - 1) / 2] : (o[o.length / 2 - 1] + o[o.length / 2]) / 2;
};
const veces = (n: number) => `${n.toFixed(1).replace('.', ',')}×`;

/** Lo que la lección de cada red dice que mirar cuando una pieza se queda corta. */
const QUE_MIRAR: Record<RedExtra, string> = {
  tiktok: 'Mirad los 3 primeros segundos: ahí decide TikTok si lo enseña a más gente.',
  youtube: 'Mirad la portada y el título: es lo que decide el clic.',
};

/** Compara las visualizaciones de la pieza con las de las otras piezas de esa red (`previas`, ya filtradas). */
export function lecturaRelativa(red: RedExtra, metricas: MetricasRed, previas: MetricasRed[]): Lectura {
  const nombre = ETIQUETA_RED_METRICAS[red];
  const vistas = metricas.visualizaciones ?? 0;
  if (vistas < ALCANCE_MINIMO) {
    return { estado: 'sin_comparar', veces: null, mensaje: `Con menos de ${ALCANCE_MINIMO} visualizaciones ningún porcentaje dice nada: esperad un poco más y volved a anotarlo.` };
  }
  const habituales = previas.map((p) => p.visualizaciones ?? 0).filter((v) => v >= ALCANCE_MINIMO);
  if (habituales.length < MIN_PREVIAS) {
    return { estado: 'sin_comparar', veces: null, mensaje: `Anotado. Todavía no hay con qué compararlo: con ${MIN_PREVIAS} piezas medidas en ${nombre} sabremos si fue buena.` };
  }
  const x = vistas / mediana(habituales);
  if (x >= UMBRAL_ALTO) return { estado: 'por_encima', veces: x, mensaje: `Llegó más lejos de lo habitual: ${veces(x)} vuestra mediana en ${nombre}. Repetid lo que hicisteis.` };
  if (x <= UMBRAL_BAJO) return { estado: 'por_debajo', veces: x, mensaje: `Llegó menos de lo habitual (${veces(x)} vuestra mediana en ${nombre}). ${QUE_MIRAR[red]}` };
  return { estado: 'en_su_linea', veces: x, mensaje: `Dentro de lo habitual en ${nombre} (${veces(x)} vuestra mediana).` };
}

/* ----------------------------------------------------------------- qué piezas esperan sus números aquí */

export interface ResultadoRed {
  fecha: string;
  tarjetaId: string;
  red: RedExtra;
  formato: Formato;
  titulo: string;
  metricas: MetricasRed;
}

/** Las métricas de las otras piezas de esa red en el último mes: «lo habitual» con lo que se compara. */
export function previasDe(resultados: ResultadoRed[], actual: Pick<ResultadoRed, 'fecha' | 'tarjetaId' | 'red'>, hoy: string): MetricasRed[] {
  return resultados
    .filter((r) => r.red === actual.red && !(r.fecha === actual.fecha && r.tarjetaId === actual.tarjetaId))
    .filter((r) => { const d = diasEntre(r.fecha, hoy); return d >= 0 && d <= DIAS_HABITUAL; })
    .map((r) => r.metricas);
}

/** La red en la que se mide primero: Instagram si están, y si no la primera que tengan. */
export function redPrincipal(redes: readonly Red[]): Red {
  return redes.includes('instagram') ? 'instagram' : redes[0] ?? 'instagram';
}

/** Las demás redes en las que puede haberse publicado el mismo vídeo. Solo los reels van a más de una red. */
export function redesExtra(formato: Formato, redes: readonly Red[]): RedExtra[] {
  if (formato !== 'reel') return [];
  const principal = redPrincipal(redes);
  return REDES_EXTRA.filter((r) => redes.includes(r) && r !== principal);
}

export interface PorMedirOtrasRedes {
  fecha: string;
  tarjetaId: string;
  formato: Formato;
  titulo: string;
  /** Redes donde pudo publicarse y aún no se han anotado. */
  redes: RedExtra[];
}

const MAX_OTRAS = 3;

/**
 * Piezas ya medidas en la red principal cuyo mismo vídeo pudo salir también en otra red de la banda.
 * No bloquean nada ni salen en el aviso de Hoy: es un extra opcional, que desaparece a los 14 días.
 */
export function otrasRedesPorMedir(
  acciones: AccionRegistrada[],
  medidasPrincipal: Array<{ fecha: string; tarjetaId: string }>,
  resultadosRed: ResultadoRed[],
  hoy: string,
  redes: readonly Red[],
): PorMedirOtrasRedes[] {
  return acciones
    .filter((a) => {
      const dias = diasEntre(a.fecha, hoy);
      return a.accion === 'hecho' && dias >= DIAS_PARA_MEDIR && dias <= DIAS_MAXIMOS_PARA_MEDIR
        && medidasPrincipal.some((m) => m.fecha === a.fecha && m.tarjetaId === a.tarjetaId);
    })
    .map((a) => ({
      fecha: a.fecha, tarjetaId: a.tarjetaId, formato: a.formato, titulo: tituloDe(a),
      redes: redesExtra(a.formato, redes).filter((r) => !resultadosRed.some((x) => x.fecha === a.fecha && x.tarjetaId === a.tarjetaId && x.red === r)),
    }))
    .filter((p) => p.redes.length > 0)
    .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))
    .slice(0, MAX_OTRAS);
}
