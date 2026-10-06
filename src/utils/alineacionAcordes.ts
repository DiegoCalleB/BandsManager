import type { SegmentoAcordeAnalizado } from '../types';
import { normalizarAcorde } from './lineaTiempoAcordes';

/**
 * Alineación entre los acordes escritos en el cifrado (en orden de aparición) y los detectados
 * en el audio. No hay marcas de tiempo por palabra, así que se alinean las SECUENCIAS de acordes
 * (Needleman-Wunsch) y cada acorde del texto hereda el tiempo del tramo con el que casa.
 *
 * Tres decisiones para que sea robusta con cifrados reales:
 *  - Los acordes se comparan por familia (Am7 ≈ Am) y por raíz, con costes graduales.
 *  - Los huecos son baratos: el audio repite estribillos que el cifrado suele escribir una vez, y
 *    el detector se salta o inventa algún cambio.
 *  - Se prueban las 12 transposiciones del cifrado: si está escrito en otra tonalidad que la
 *    grabación (capo, versión transportada) sigue alineando, y se avisa de la diferencia.
 */

const SECCIONES = /^(intro|verso|estribillo|coro|puente|solo|outro|coda|final|pre[- ]?estribillo|interludio|instrumental|bis)\b/i;
const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** ¿Lo que hay entre corchetes es un acorde (y no una cabecera de sección como [Solo] o [Verso 1])? */
export function esTokenAcorde(contenido: string): boolean {
  const t = contenido.trim();
  if (!t || SECCIONES.test(t)) return false;
  const n = normalizarAcorde(t);
  return n !== null && n !== 'N';
}

/**
 * Línea que el visor pinta como cabecera de sección ([Intro], [Verso 1], [Solo]…). Es la MISMA
 * regla que usa el visor para dibujar, y debe seguir siéndolo: la alineación cuenta los acordes
 * en el mismo orden en que el visor los dibuja.
 */
export function esLineaCabecera(linea: string): boolean {
  return /^\[(Intro|Verso|Estribillo|Coro|Puente|Solo|Outro|Coda|Final|Intro\s\d+|Verso\s\d+)\]/i.test(linea.trim());
}

/** Acordes entre corchetes de un cifrado, en el orden en que el visor los dibuja, normalizados. */
export function acordesDelCifrado(texto: string): string[] {
  const salida: string[] = [];
  for (const linea of (texto || '').split('\n')) {
    if (esLineaCabecera(linea)) continue;
    for (const m of linea.matchAll(/\[([A-Za-z0-9#\/]+)\]/g)) {
      if (esTokenAcorde(m[1])) salida.push(normalizarAcorde(m[1]) as string);
    }
  }
  return salida;
}

interface Partes { raiz: number; calidadMenor: boolean; resto: string }

function partes(acorde: string): Partes | null {
  const m = /^([A-G]#?)(.*?)(\/[A-G]#?)?$/.exec(acorde);
  if (!m) return null;
  const sufijo = m[2];
  return { raiz: NOTAS.indexOf(m[1]), calidadMenor: /^m(?!aj)/.test(sufijo) || /^min/.test(sufijo) || /^dim/.test(sufijo), resto: sufijo };
}

/** Sube o baja un acorde normalizado `semitonos` (manteniendo sufijo y bajo). */
export function transponerAcorde(acorde: string, semitonos: number): string {
  const cambia = (n: string) => NOTAS[(NOTAS.indexOf(n) + semitonos + 1200) % 12];
  return acorde.replace(/([A-G]#?)/g, (_m, n) => cambia(n));
}

function coste(a: string, b: string): number {
  if (a === b) return 0;
  const pa = partes(a);
  const pb = partes(b);
  if (!pa || !pb || pa.raiz !== pb.raiz) return 1;
  return pa.calidadMenor === pb.calidadMenor ? 0.15 : 0.6;
}

const GAP_TEXTO = 0.8; // acorde del cifrado sin pareja en el audio
const GAP_AUDIO = 0.6; // acorde del audio sin pareja en el cifrado (repeticiones, cambios espurios)

export interface ParAlineado {
  /** Índice del acorde en el cifrado (orden de aparición). */
  texto: number;
  /** Índice del segmento del audio con el que casa, o null. */
  segmento: number | null;
  /** true si coinciden (misma familia); false si casaron por posición pero difieren. */
  coincide: boolean;
  /** true si el tramo no es una pareja real sino una estimación (el acorde no tenía pareja en el audio). */
  estimado?: boolean;
}

export interface Alineacion {
  desplazamiento: number; // semitonos que hubo que subir el cifrado para que case con el audio
  calidad: number; // 0-1: acordes que coinciden, sobre el lado más corto (cifrado o audio)
  usable: boolean;
  pares: ParAlineado[];
}

const CALIDAD_MINIMA = 0.5;

function alinearConDesplazamiento(texto: string[], audio: string[], desplazamiento: number) {
  const n = texto.length;
  const m = audio.length;
  const t = texto.map((a) => transponerAcorde(a, desplazamiento));
  const D = Array.from({ length: n + 1 }, () => new Float64Array(m + 1));
  for (let i = 1; i <= n; i++) D[i][0] = i * GAP_TEXTO;
  for (let j = 1; j <= m; j++) D[0][j] = j * GAP_AUDIO;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      D[i][j] = Math.min(
        D[i - 1][j - 1] + coste(t[i - 1], audio[j - 1]),
        D[i - 1][j] + GAP_TEXTO,
        D[i][j - 1] + GAP_AUDIO,
      );
    }
  }
  // Traza hacia atrás: a cada acorde del cifrado, su pareja en el audio (o ninguna).
  const pareja: (number | null)[] = new Array(n).fill(null);
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    const c = coste(t[i - 1], audio[j - 1]);
    // En un empate se prefiere saltar acordes del final del audio: así, si el cifrado cubre una
    // sola vez lo que el audio repite, casa con la PRIMERA vez y no con la última.
    if (Math.abs(D[i][j] - (D[i][j - 1] + GAP_AUDIO)) < 1e-9) {
      j--;
    } else if (Math.abs(D[i][j] - (D[i - 1][j - 1] + c)) < 1e-9) {
      pareja[i - 1] = j - 1;
      i--; j--;
    } else {
      i--;
    }
  }
  return { coste: D[n][m], pareja, t };
}

/**
 * Un acorde del texto sin pareja exacta (el audio lo detectó distinto o no lo detectó) no puede
 * quedarse sin tiempo: nunca se resaltaría y el cursor «saltaría» de uno a otro. Se le da el tramo
 * que cae entre las parejas vecinas, repartiendo por orden. `coincide` sigue en false: es una
 * estimación para el resaltado, no una coincidencia que cuente para la calidad.
 */
function rellenarSinPareja(pares: ParAlineado[], origen: number[]): void {
  let i = 0;
  while (i < pares.length) {
    if (pares[i].segmento !== null) { i++; continue; }
    let fin = i;
    while (fin < pares.length && pares[fin].segmento === null) fin++;
    const antes = i > 0 ? (pares[i - 1].segmento as number) : -1;
    const despues = fin < pares.length ? (pares[fin].segmento as number) : Infinity;
    const hueco = origen.filter((o) => o > antes && o < despues);
    const n = fin - i;
    if (hueco.length > 0) {
      for (let k = 0; k < n; k++) {
        const idx = Math.min(hueco.length - 1, Math.floor(((k + 0.5) * hueco.length) / n));
        pares[i + k] = { ...pares[i + k], segmento: hueco[idx], estimado: true };
      }
    }
    i = fin;
  }
}

/**
 * Alinea los acordes del cifrado con los segmentos detectados. Devuelve null si no hay material
 * suficiente (menos de 2 acordes en alguno de los lados).
 */
export function alinearCifradoConAudio(
  cifrado: string,
  segmentos: SegmentoAcordeAnalizado[],
): Alineacion | null {
  const texto = acordesDelCifrado(cifrado);

  // Audio: sin los «N»; se recuerda el segmento original. NO se funden las repeticiones: un cifrado
  // que escribe el mismo acorde dos veces seguidas (porque entre ellas hubo un silencio, o porque
  // se repite en dos versos) necesita dos tramos con los que casar; si fundiéramos, el segundo
  // acorde del texto se quedaba sin pareja y el resaltado «se lo saltaba». Si el audio trae un
  // acorde partido en dos tramos que el texto escribe una sola vez, el alineamiento descarta uno.
  const audio: string[] = [];
  const origen: number[] = [];
  segmentos.forEach((s, idx) => {
    if (s.acorde === 'N') return;
    audio.push(s.acorde);
    origen.push(idx);
  });
  if (texto.length < 2 || audio.length < 2) return null;

  let mejor: { d: number; r: ReturnType<typeof alinearConDesplazamiento> } | null = null;
  for (let d = 0; d < 12; d++) {
    const r = alinearConDesplazamiento(texto, audio, d);
    if (!mejor || r.coste < mejor.r.coste - 1e-9) mejor = { d, r };
  }
  const { d, r } = mejor!;
  const pares: ParAlineado[] = r.pareja.map((j, i) => ({
    texto: i,
    segmento: j === null ? null : origen[j],
    coincide: j !== null && coste(r.t[i], audio[j]) <= 0.15,
  }));
  // Se mide contra el lado más corto: un cifrado de 30 acordes frente a un audio de 10 (o al
  // revés, un estribillo escrito una vez frente a un audio que lo repite) no debe parecer peor
  // alineado por tener más material de un lado que del otro.
  // El alineamiento ancla el tramo del audio al ÚLTIMO acorde de una tanda de iguales (Mi Mi Mi frente
  // a un solo «Mi» detectado) y el reloj saltaba a él nada más empezar. El tramo empieza donde empieza
  // la tanda: se pasa la pareja al primero y los repetidos quedan después, con el inicio de su frase.
  for (let i = 1; i < pares.length; i++) {
    let k = i;
    while (k > 0 && pares[k].segmento !== null && pares[k - 1].segmento === null && r.t[k - 1] === r.t[k]) {
      pares[k - 1] = { ...pares[k - 1], segmento: pares[k].segmento, coincide: pares[k].coincide };
      pares[k] = { ...pares[k], segmento: null, coincide: false };
      k--;
    }
  }
  rellenarSinPareja(pares, origen);
  const calidad = pares.filter((p) => p.coincide).length / Math.min(texto.length, audio.length);
  return { desplazamiento: d, calidad, usable: calidad >= CALIDAD_MINIMA, pares };
}

/**
 * Línea (índice en el texto) en la que está cada acorde del cifrado, en el mismo orden que
 * `acordesDelCifrado`. Sirve para dar tiempo a los acordes sin pareja en el audio a partir del
 * momento en que empieza su frase.
 */
export function lineaDeCadaAcorde(texto: string): number[] {
  const salida: number[] = [];
  (texto || '').split('\n').forEach((linea, i) => {
    if (esLineaCabecera(linea)) return;
    for (const m of linea.matchAll(/\[([A-Za-z0-9#\/]+)\]/g)) if (esTokenAcorde(m[1])) salida.push(i);
  });
  return salida;
}

/**
 * Instante (s) en el que suena CADA acorde del cifrado. Los que casan con un tramo del audio toman su
 * inicio; los que no (típicamente el acorde que se repite al empezar una frase aunque en el audio
 * no cambie, o uno que el detector no vio) toman el inicio de su frase si cae entre sus vecinos y,
 * si no, un reparto uniforme entre ellos. Los tiempos son ESTRICTAMENTE crecientes dentro de cada
 * hueco, así el resaltado pasa por todos los acordes y nunca «se salta» uno.
 */
export function tiemposDeAcordes(
  alineacion: Alineacion | null,
  segmentos: SegmentoAcordeAnalizado[],
  tiemposLinea: Array<number | null> = [],
): number[] {
  if (!alineacion?.usable) return [];
  const n = alineacion.pares.length;
  const t: Array<number | null> = alineacion.pares.map((p) => (p.segmento === null || p.estimado ? null : segmentos[p.segmento]?.t0 ?? null));
  let i = 0;
  while (i < n) {
    if (t[i] !== null) { i++; continue; }
    let fin = i;
    while (fin < n && t[fin] === null) fin++;
    const a = i > 0 ? (t[i - 1] as number) : 0;
    const b = fin < n ? (t[fin] as number) : null;
    const huecos = fin - i;
    // 1) el inicio de la frase de cada acorde, si es creciente y cae entre los vecinos
    const porLinea = Array.from({ length: huecos }, (_, k) => tiemposLinea[i + k] ?? null);
    const valido = porLinea.every((x, k) => x !== null && x > (k === 0 ? a : (porLinea[k - 1] as number)) + 1e-6 && (b === null || x < b - 1e-6));
    for (let k = 0; k < huecos; k++) {
      t[i + k] = valido
        ? (porLinea[k] as number)
        : b === null
          ? a + 0.4 * (k + 1)
          : a + ((k + 1) / (huecos + 1)) * (b - a);
    }
    i = fin;
  }
  return t.map((x) => Math.round((x as number) * 1000) / 1000);
}

/** Qué acorde del cifrado suena en el instante `t`: el último cuyo tiempo ya ha llegado (−1 si ninguno). */
export function acordeActivoPorTiempo(tiempos: number[], t: number): number {
  let lo = 0, hi = tiempos.length - 1, mejor = -1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (tiempos[m] <= t + 1e-6) { mejor = m; lo = m + 1; } else hi = m - 1;
  }
  // Con tiempos iguales (acordes repetidos antes del primer cambio detectado, todos en 0 s) manda el
  // primero: el último hacía que al empezar el reloj saltara a un acorde de mitad de canción.
  while (mejor > 0 && tiempos[mejor - 1] === tiempos[mejor]) mejor--;
  return mejor;
}

/**
 * Qué acorde del cifrado está sonando según el SEGMENTO actual (versión sin tiempos propios por
 * acorde; el visor usa `tiemposDeAcordes` + `acordeActivoPorTiempo`).
 */
export function acordeActivoDelCifrado(
  alineacion: Alineacion | null,
  segmentoActual: number,
): number {
  if (!alineacion?.usable || segmentoActual < 0) return -1;
  let activo = -1;
  for (const p of alineacion.pares) {
    if (p.segmento === null) continue;
    if (p.segmento <= segmentoActual) activo = p.texto;
    else break;
  }
  return activo;
}

const quitaAcordes = (linea: string) => linea.replace(/\[[^\]]*\]/g, '');
const normalizaLetra = (t: string) =>
  t.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();

/**
 * Asocia cada línea del cifrado con la línea de letra transcrita (con tiempos) de la que salió,
 * comparando el texto sin acordes. Devuelve, para cada línea del cifrado, el índice de la línea
 * de letra o null. Tolera que la banda haya editado o borrado alguna línea (mira unas cuantas
 * líneas por delante) y que haya cabeceras y líneas de solo acordes.
 */
export function asociarLineasConLetra(cifrado: string, letra: Array<{ texto: string }>): Array<number | null> {
  const lineas = (cifrado || '').split('\n');
  const salida: Array<number | null> = new Array(lineas.length).fill(null);
  let k = 0;
  lineas.forEach((linea, i) => {
    if (esLineaCabecera(linea)) return;
    const plano = normalizaLetra(quitaAcordes(linea));
    if (!plano) return;
    for (let salto = 0; salto <= 3 && k + salto < letra.length; salto++) {
      if (normalizaLetra(letra[k + salto].texto) === plano) {
        salida[i] = k + salto;
        k = k + salto + 1;
        return;
      }
    }
  });
  return salida;
}
