import { Song, SetlistItem } from '../types';
import { parseTonalidad, evaluarTransicionArmonica, CompatibilidadArmonica } from './harmonicAnalysis';

/**
 * Coste de una transición entre dos canciones consecutivas del setlist, combinando las tres
 * señales que de verdad se notan al pasar de un tema a otro en directo: choque de tonalidad,
 * salto de tempo y salto de energía. 0 = transición perfecta, 1 = el peor caso posible.
 *
 * Pesos deliberados, no derivados de datos: un choque armónico se percibe como el más brusco de
 * los tres (una disonancia real de nota, no solo una sensación), el salto de tempo el segundo
 * (obliga a la banda a "cambiar de marcha" en directo), y el salto de energía el que menos —
 * a veces un contraste fuerte de energía es la intención (una balada antes del bis explosivo).
 */
const PESO_ARMONIA = 0.4;
const PESO_BPM = 0.35;
const PESO_ENERGIA = 0.25;

/** A partir de este salto de BPM, el coste de tempo ya se considera máximo (1). */
const BPM_DIFF_MAXIMA = 40;
/** A partir de este salto de energía (escala 1-20), el coste ya se considera máximo (1) —
 * de balada (~6) a explosiva (~20) es prácticamente el salto real más grande del repertorio. */
const ENERGIA_DIFF_MAXIMA = 14;

export interface CosteTransicion {
  /** 0 (transición perfecta) a 1 (peor caso) */
  total: number;
  harmonyCost: number;
  bpmCost: number;
  energyCost: number;
  harmonyRelation: CompatibilidadArmonica | 'desconocida';
  bpmDiff: number | null;
  energyDiff: number | null;
}

function costeArmonia(relation: CompatibilidadArmonica | null): number {
  switch (relation) {
    case 'identica': return 0;
    case 'compatible': return 0.15;
    case 'neutra': return 0.5;
    case 'choque': return 1;
    default: return 0.35; // sin tonalidad fiable en alguna de las dos: coste neutro, ni premia ni castiga
  }
}

/** Calcula el coste de pasar de la canción `a` a la canción `b` en directo. */
export function calcularCosteTransicion(a: Song, b: Song): CosteTransicion {
  const keyA = parseTonalidad(a.tonalidad);
  const keyB = parseTonalidad(b.tonalidad);
  const harmonyRelation = keyA && keyB ? evaluarTransicionArmonica(keyA, keyB) : null;
  const harmonyCost = costeArmonia(harmonyRelation);

  const bpmA = typeof a.bpm === 'number' && a.bpm > 0 ? a.bpm : null;
  const bpmB = typeof b.bpm === 'number' && b.bpm > 0 ? b.bpm : null;
  const bpmDiff = bpmA !== null && bpmB !== null ? Math.abs(bpmA - bpmB) : null;
  const bpmCost = bpmDiff !== null ? Math.max(0, Math.min(1, bpmDiff / BPM_DIFF_MAXIMA)) : 0.3;

  const energyA = typeof a.energia === 'number' ? a.energia : null;
  const energyB = typeof b.energia === 'number' ? b.energia : null;
  const energyDiff = energyA !== null && energyB !== null ? Math.abs(energyA - energyB) : null;
  const energyCost = energyDiff !== null ? Math.max(0, Math.min(1, energyDiff / ENERGIA_DIFF_MAXIMA)) : 0.3;

  const total = harmonyCost * PESO_ARMONIA + bpmCost * PESO_BPM + energyCost * PESO_ENERGIA;

  return {
    total,
    harmonyCost,
    bpmCost,
    energyCost,
    harmonyRelation: harmonyRelation ?? 'desconocida',
    bpmDiff,
    energyDiff
  };
}

export interface EvaluacionUnion {
  status: 'ok' | 'review';
  icon: '✓' | '✕';
  scorePercent: number;
  title: string;
  shortBadge: string;
  motivos: string[];
  coste: CosteTransicion;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

/**
 * Evalúa de forma integral la unión entre dos canciones consecutivas (✓ o ✕)
 * para que el músico sepa al instante si la transición es armónica y fluida o si requiere revisión.
 */
export function evaluarCalidadUnion(songA: Song, songB: Song): EvaluacionUnion {
  const coste = calcularCosteTransicion(songA, songB);
  const scorePercent = Math.round(Math.max(0, Math.min(100, (1 - coste.total) * 100)));
  const motivos: string[] = [];
  const avisosCriticos: string[] = [];

  // 1. Armonía
  if (coste.harmonyRelation === 'choque') {
    avisosCriticos.push(`Choque tonal (${songA.tonalidad || '?'} ➔ ${songB.tonalidad || '?'})`);
  } else if (coste.harmonyRelation === 'identica') {
    motivos.push(`Misma tonalidad (${songA.tonalidad || '?'})`);
  } else if (coste.harmonyRelation === 'compatible') {
    motivos.push(`Tonalidades afines (${songA.tonalidad || '?'} ➔ ${songB.tonalidad || '?'})`);
  }

  // 2. Tempo (BPM)
  if (coste.bpmDiff !== null) {
    if (coste.bpmDiff >= 25) {
      avisosCriticos.push(`Salto de ${Math.round(coste.bpmDiff)} BPM (${songA.bpm} ➔ ${songB.bpm})`);
    } else if (coste.bpmDiff <= 8) {
      motivos.push(`Tempo continuo (Δ${Math.round(coste.bpmDiff)} BPM)`);
    } else {
      motivos.push(`Salto moderado (Δ${Math.round(coste.bpmDiff)} BPM)`);
    }
  }

  // 3. Energía
  if (coste.energyDiff !== null) {
    if (coste.energyDiff >= 8) {
      avisosCriticos.push(`Salto de energía (Δ${Math.round(coste.energyDiff)} pts)`);
    } else if (coste.energyDiff <= 3) {
      motivos.push('Energía fluida');
    }
  }

  const isOk = avisosCriticos.length === 0 && scorePercent >= 60 && coste.harmonyRelation !== 'choque';
  const status: 'ok' | 'review' = isOk ? 'ok' : 'review';
  const icon = isOk ? '✓' : '✕';

  const title = isOk
    ? `Unión fluida y armónica (${scorePercent}%)`
    : `Revisar unión (${scorePercent}%${avisosCriticos.length > 0 ? ` · ${avisosCriticos[0]}` : ''})`;

  const shortBadge = isOk
    ? `✓ OK (${scorePercent}%)`
    : `✕ Revisar (${scorePercent}%)`;

  const badgeBg = isOk ? 'bg-emerald-500/15' : 'bg-rose-500/15';
  const badgeText = isOk ? 'text-emerald-300' : 'text-rose-300';
  const badgeBorder = isOk ? 'border-emerald-500/35' : 'border-rose-500/40';

  return {
    status,
    icon,
    scorePercent,
    title,
    shortBadge,
    motivos: avisosCriticos.length > 0 ? avisosCriticos : motivos,
    coste,
    badgeBg,
    badgeText,
    badgeBorder
  };
}

export interface HuecoCancion {
  item: SetlistItem;
  song: Song;
}

export interface SugerenciaChapa {
  /** Id del item (canción) tras el cual se debería insertar la chapa/interludio. */
  insertAfterItemId: string;
  cancionAntes: string;
  cancionDespues: string;
  coste: CosteTransicion;
}

/** Por debajo de este coste, la transición ya es lo bastante suave como para no merecer forzar
 * una chapa ahí solo por sugerir algo. */
const UMBRAL_COSTE_SUGERIR_CHAPA = 0.4;

/**
 * Encuentra el mejor punto del setlist ACTUAL (sin reordenar) para meter una chapa/interludio
 * hablado: la transición entre canciones YA consecutivas con más coste (choque de tonalidad +
 * salto de tempo + salto de energía). Justo ahí es donde más se nota el "pegote" en directo —
 * un corte hablado rompe el segue directo, así que el choque deja de sufrirse de golpe.
 *
 * Solo mira pares de canciones que ya están consecutivas de verdad (sin ningún bloque de por
 * medio): insertar una segunda chapa junto a una que ya existe no soluciona nada nuevo.
 * Devuelve null si la peor transición ya es razonablemente suave (no hay nada que merezca la pena).
 */
export function sugerirMejorPuntoParaChapa(items: SetlistItem[], songs: Song[]): SugerenciaChapa | null {
  let mejor: SugerenciaChapa | null = null;

  for (let i = 0; i < items.length - 1; i++) {
    const actual = items[i];
    const siguiente = items[i + 1];
    if (actual.tipoItem !== 'cancion' || siguiente.tipoItem !== 'cancion') continue;

    const songA = songs.find((s) => s.id === actual.songId);
    const songB = songs.find((s) => s.id === siguiente.songId);
    if (!songA || !songB) continue;

    const coste = calcularCosteTransicion(songA, songB);
    if (!mejor || coste.total > mejor.coste.total) {
      mejor = { insertAfterItemId: actual.id, cancionAntes: songA.titulo, cancionDespues: songB.titulo, coste };
    }
  }

  if (!mejor || mejor.coste.total < UMBRAL_COSTE_SUGERIR_CHAPA) return null;
  return mejor;
}

/** Suma el coste de todas las transiciones consecutivas de un orden dado. */
export function costeTotalTransiciones(orden: HuecoCancion[]): number {
  let total = 0;
  for (let i = 0; i < orden.length - 1; i++) {
    total += calcularCosteTransicion(orden[i].song, orden[i + 1].song).total;
  }
  return total;
}

/**
 * Reordena canciones para minimizar el coste total de transición (armonía + tempo + energía)
 * entre temas consecutivos.
 *
 * Determinista y explicable a propósito, sin LLM ni caja negra de por medio — el mismo
 * repertorio con los mismos datos siempre da el mismo orden, y cada coste de transición se puede
 * mostrar y justificar en el propio gráfico:
 *  1. Construcción por vecino más cercano, siempre empezando por la apertura que ya eligió el
 *     usuario (nunca se mueve la primera canción — es una elección deliberada, no un dato más).
 *  2. Refinamiento 2-opt: prueba a invertir cada tramo posible: si eso reduce la suma de las dos
 *     transiciones que cambian, se queda con la inversión. Se repite hasta que ya no mejora nada
 *     o se agota el límite de iteraciones (con repertorios de banda, unas pocas decenas de temas,
 *     converge casi siempre en 1-2 pasadas).
 */
export function optimizarOrdenPorTransiciones(slots: HuecoCancion[]): HuecoCancion[] {
  if (slots.length <= 2) return slots;

  const costeEntre = (a: HuecoCancion, b: HuecoCancion) => calcularCosteTransicion(a.song, b.song).total;

  const restantes = slots.slice(1);
  const orden: HuecoCancion[] = [slots[0]];
  while (restantes.length > 0) {
    const actual = orden[orden.length - 1];
    let mejorIdx = 0;
    let mejorCoste = Infinity;
    for (let i = 0; i < restantes.length; i++) {
      const c = costeEntre(actual, restantes[i]);
      if (c < mejorCoste) { mejorCoste = c; mejorIdx = i; }
    }
    orden.push(restantes[mejorIdx]);
    restantes.splice(mejorIdx, 1);
  }

  const n = orden.length;
  let mejorado = true;
  let iteraciones = 0;
  const MAX_ITERACIONES = 200;
  while (mejorado && iteraciones < MAX_ITERACIONES) {
    mejorado = false;
    iteraciones++;
    for (let i = 1; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const hayDespues = j < n - 1;
        const costeActual = costeEntre(orden[i - 1], orden[i]) + (hayDespues ? costeEntre(orden[j], orden[j + 1]) : 0);
        const costeNuevo = costeEntre(orden[i - 1], orden[j]) + (hayDespues ? costeEntre(orden[i], orden[j + 1]) : 0);
        if (costeNuevo < costeActual - 1e-9) {
          let lo = i, hi = j;
          while (lo < hi) {
            const tmp = orden[lo]; orden[lo] = orden[hi]; orden[hi] = tmp;
            lo++; hi--;
          }
          mejorado = true;
        }
      }
    }
  }

  return orden;
}
