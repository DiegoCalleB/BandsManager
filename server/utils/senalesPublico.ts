/**
 * Señales de público: lo que la gente ya ha demostrado que le interesa de un vídeo de YouTube.
 *
 * Complementan a las señales medidas sobre el audio (volumen, arranque, planos): esas dicen
 * "aquí suena fuerte", estas dicen "aquí vuelve la gente". Dos fuentes:
 *   - el gráfico de "lo más reproducido" que YouTube calcula con las repeticiones reales;
 *   - los comentarios con marca de tiempo ("2:34 🔥"), que son momentos marcados a mano.
 *
 * Solo se usan en vídeos de música: en una charla o un tutorial un pico de repeticiones significa
 * otra cosa (volver a una explicación) y haría que el selector eligiera mal.
 *
 * Todo es puro: la red y yt-dlp viven en los servicios que llaman a este módulo.
 */
import type { TipoContenido } from "./viralSignals.js";

export interface PuntoInteres {
  start: number;
  end: number;
  /** 0-1, relativo al propio vídeo (YouTube normaliza el máximo a 1). */
  valor: number;
}

export interface MarcaDeTiempo {
  t: number;
  peso: number;
}

export interface CurvaInteres {
  /** Un valor 0-100 por segundo del vídeo. */
  curva: number[];
  /** Cuánto debe pesar en la puntuación de una ventana: depende de lo fiable que sea la fuente. */
  peso: number;
  fuentes: { heatmap: boolean; marcas: number };
}

/** Categoría "Music" de la Data API. */
const CATEGORIA_MUSICA = "10";
const MIN_TRAMOS_HEATMAP = 10;
/** Por debajo de esto el rango del gráfico es ruido: un vídeo sin picos reales. */
const RANGO_MINIMO = 0.1;
const MIN_MARCAS_SOLAS = 5;
const MIN_MARCAS_CON_HEATMAP = 3;
const MAX_MARCAS_POR_COMENTARIO = 3;
const MAX_COMENTARIOS = 300;
const SIGMA_MARCA_SEG = 4;
/** Más largo que esto no es un vídeo musical: es un directo de 24 h o un dato corrupto. Evita arrays enormes. */
export const MAX_DURACION_SEG = 6 * 3600;
const PESO_HEATMAP = 0.4;
const PESO_SOLO_COMENTARIOS = 0.25;
/** Cuánto del interés combinado sale de los comentarios cuando también hay heatmap. */
const MEZCLA_COMENTARIOS = 0.25;

/* ------------------------------------------------------------------ filtro de música */

export interface FichaMusical {
  categoriaId?: string;
  categorias?: unknown;
  /** yt-dlp devuelve `track`/`artist` cuando YouTube ha reconocido la canción. */
  pista?: boolean;
}

/** true = música, false = otra categoría conocida, null = no hay datos para saberlo. */
export function esVideoDeMusica(f: FichaMusical): boolean | null {
  const categorias = Array.isArray(f.categorias) ? f.categorias.map((c) => String(c).trim()).filter(Boolean) : [];
  if (f.categoriaId === CATEGORIA_MUSICA || f.pista === true || categorias.some((c) => /music|música|musica/i.test(c))) return true;
  if (f.categoriaId || categorias.length > 0) return false;
  return null;
}

/**
 * Decide si se usan las señales de público. Si no se conoce la categoría se decide por lo que
 * dicen el título y la descripción: un bolo o un videoclip sí, un ensayo o "otro" no.
 */
export function usarSenalesDePublico(esMusica: boolean | null, tipo: TipoContenido): boolean {
  if (esMusica !== null) return esMusica;
  return tipo === "concierto" || tipo === "videoclip";
}

/* ------------------------------------------------------------------ heatmap */

/** Gráfico de "lo más reproducido" de yt-dlp (`heatmap`), validado. [] si no es fiable. */
export function normalizarHeatmap(bruto: unknown, duracion: number): PuntoInteres[] {
  if (!Array.isArray(bruto) || !(duracion > 0)) return [];
  const puntos: PuntoInteres[] = [];
  for (const p of bruto as Array<{ start_time?: unknown; end_time?: unknown; value?: unknown } | null>) {
    const start = Number(p?.start_time);
    const end = Number(p?.end_time);
    const valor = Number(p?.value);
    if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(valor) || start < 0 || end <= start || start >= duracion) continue;
    puntos.push({ start, end: Math.min(end, duracion), valor: Math.max(0, Math.min(1, valor)) });
  }
  return puntos.length >= MIN_TRAMOS_HEATMAP ? puntos.sort((a, b) => a.start - b.start) : [];
}

/* ------------------------------------------------------------------ comentarios */

const MARCA = /(?<![\d:.])(?:(\d{1,2}):)?([0-5]?\d):([0-5]\d)(?![\d:])/g;

/**
 * Marcas de tiempo de los comentarios, ponderadas por sus likes. Un comentario con muchas marcas
 * es un índice de temas, no una reacción, y se descarta.
 */
export function marcasDeTiempo(comentarios: Array<{ texto: string; likes: number }>, duracion: number): MarcaDeTiempo[] {
  const salida: MarcaDeTiempo[] = [];
  for (const c of comentarios.slice(0, MAX_COMENTARIOS)) {
    const vistos = new Set<number>();
    for (const m of String(c.texto || "").matchAll(MARCA)) {
      const t = Number(m[1] || 0) * 3600 + Number(m[2]) * 60 + Number(m[3]);
      vistos.add(t);
    }
    if (vistos.size === 0 || vistos.size > MAX_MARCAS_POR_COMENTARIO) continue;
    const peso = Math.min(6, 1 + Math.log(1 + Math.max(0, Number(c.likes) || 0)));
    for (const t of vistos) if (t > 0 && t < duracion) salida.push({ t, peso });
  }
  return salida;
}

/* ------------------------------------------------------------------ curva */

function curvaDelHeatmap(heatmap: PuntoInteres[], largo: number): number[] | null {
  const n = Math.min(largo, MAX_DURACION_SEG);
  const curva = new Array<number>(n).fill(0);
  for (const p of heatmap) for (let s = Math.floor(p.start); s < Math.min(n, Math.ceil(p.end)); s++) curva[s] = p.valor;
  // Al principio de un vídeo YouTube acumula repeticiones de gente que vuelve a empezar: no dice
  // nada del contenido. Se limita a la mediana para que no arrastre la elección hacia el minuto 0.
  const ordenados = [...curva].sort((a, b) => a - b);
  const mediana = ordenados[Math.floor(n / 2)];
  const intro = Math.min(n, Math.max(4, Math.round(n * 0.03)));
  for (let s = 0; s < intro; s++) curva[s] = Math.min(curva[s], mediana);
  const min = Math.min(...curva);
  const max = Math.max(...curva);
  if (max - min < RANGO_MINIMO) return null;
  return curva.map((v) => (v - min) / (max - min));
}

function curvaDeMarcas(marcas: MarcaDeTiempo[], largo: number): number[] {
  const n = Math.min(largo, MAX_DURACION_SEG);
  const curva = new Array<number>(n).fill(0);
  for (const m of marcas) {
    const desde = Math.max(0, Math.floor(m.t - 3 * SIGMA_MARCA_SEG));
    const hasta = Math.min(n - 1, Math.ceil(m.t + 3 * SIGMA_MARCA_SEG));
    for (let s = desde; s <= hasta; s++) curva[s] += m.peso * Math.exp(-((s - m.t) ** 2) / (2 * SIGMA_MARCA_SEG ** 2));
  }
  const max = Math.max(...curva);
  return max > 0 ? curva.map((v) => v / max) : curva;
}

/**
 * Curva de interés por segundo (0-100) combinando las fuentes que haya, o null si no hay
 * evidencia suficiente. Con el heatmap manda él y los comentarios afinan; sin heatmap hacen
 * falta varias marcas y la señal pesa menos.
 */
export function curvaDeInteres(p: { duracion: number; heatmap?: PuntoInteres[]; marcas?: MarcaDeTiempo[] }): CurvaInteres | null {
  const n = Math.ceil(p.duracion);
  if (!(n > 0) || n > MAX_DURACION_SEG) return null;
  const marcas = p.marcas ?? [];
  const h = p.heatmap?.length ? curvaDelHeatmap(p.heatmap, n) : null;

  if (h) {
    const usaMarcas = marcas.length >= MIN_MARCAS_CON_HEATMAP;
    const c = usaMarcas ? curvaDeMarcas(marcas, n) : null;
    const mezcla = h.map((v, i) => (c ? v * (1 - MEZCLA_COMENTARIOS) + c[i] * MEZCLA_COMENTARIOS : v));
    const max = Math.max(...mezcla);
    return { curva: mezcla.map((v) => Math.round((v / max) * 100)), peso: PESO_HEATMAP, fuentes: { heatmap: true, marcas: usaMarcas ? marcas.length : 0 } };
  }
  if (marcas.length >= MIN_MARCAS_SOLAS) {
    return { curva: curvaDeMarcas(marcas, n).map((v) => Math.round(v * 100)), peso: PESO_SOLO_COMENTARIOS, fuentes: { heatmap: false, marcas: marcas.length } };
  }
  return null;
}

/** Interés medio (0-100) de los segundos [start, end). 0 si el tramo cae fuera de la curva. */
export function interesMedio(curva: number[], start: number, end: number): number {
  const tramo = curva.slice(Math.max(0, Math.floor(start)), Math.max(0, Math.ceil(end)));
  return tramo.length ? Math.round(tramo.reduce((a, b) => a + b, 0) / tramo.length) : 0;
}
