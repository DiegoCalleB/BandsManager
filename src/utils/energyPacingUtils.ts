import { Song, SetlistItem } from '../types';
import { parseTonalidad, evaluarTransicionArmonica, tonalidadesSonFiables } from './harmonicAnalysis';

export type SongEnergyCategory = 'balada' | 'media' | 'alta' | 'explosiva';

export interface EnergyInfo {
  category: SongEnergyCategory;
  score: number; // 1 to 20 scale
  label: string;
  icon: string;
  hexColor: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export interface SetlistEnergyPoint {
  index: number;
  item: SetlistItem;
  song?: Song;
  isSong: boolean;
  title: string;
  score: number;
  info: EnergyInfo;
  /** 0-10: cuánto varía la energía dentro del propio tema (detectado automáticamente del audio). 0 para eventos/bis. */
  variance: number;
}

export type EnergyProfileType = 'in_crescendo' | 'equilibrada' | 'traca_directa' | 'acustico_calma' | 'irregular';

export interface PacingWarning {
  type: 'warning' | 'tip' | 'success';
  message: string;
  icon: string;
  /** Títulos exactos de las canciones a las que se refiere este aviso, para poder resaltarlas en el gráfico. */
  songTitles?: string[];
  /** Reordenamiento concreto que resolvería este aviso (índices absolutos dentro de items),
   * calculado con una regla determinista — solo se ofrece cuando hay un movimiento razonable
   * disponible en el propio setlist (nunca inventa canciones ni sugiere "añade algo nuevo"). */
  suggestedReorder?: { fromIndex: number; toIndex: number; description: string };
}

export interface SetlistEnergyAnalysis {
  points: SetlistEnergyPoint[];
  averageEnergy: number;
  profileType: EnergyProfileType;
  profileLabel: string;
  profileIcon: string;
  warnings: PacingWarning[];
  highEnergyCount: number;
  mediumEnergyCount: number;
  lowEnergyCount: number;
  explosiveCount: number;
}

/**
  * Devuelve la información de energía para un valor numérico o una canción dada.
  */
export function getEnergyInfo(scoreOrSong?: number | Song | null): EnergyInfo {
  let score = 12; // Default to mid-tempo if undefined

  if (typeof scoreOrSong === 'number') {
    score = scoreOrSong;
  } else if (scoreOrSong && typeof scoreOrSong === 'object') {
    if (typeof scoreOrSong.energia === 'number' && Number.isFinite(scoreOrSong.energia)) {
      score = scoreOrSong.energia;
    } else {
      // Intento de deducir energía según BPM si no se especificó
      const bpm = scoreOrSong.bpm || 120;
      if (bpm >= 140) score = 18;
      else if (bpm <= 95) score = 6;
      else score = 12;
    }
  }

  if (score <= 8) {
    return {
      category: 'balada',
      score: Math.max(1, score),
      label: 'Balada / Acústica',
      icon: '🌙',
      hexColor: '#0284c7',
      bgClass: 'bg-sky-500/15',
      textClass: 'text-sky-400',
      borderClass: 'border-sky-500/30'
    };
  }

  if (score <= 14) {
    return {
      category: 'media',
      score,
      label: 'Media / Groove',
      icon: '🎵',
      hexColor: '#059669',
      bgClass: 'bg-emerald-500/15',
      textClass: 'text-emerald-400',
      borderClass: 'border-emerald-500/30'
    };
  }

  if (score <= 18) {
    return {
      category: 'alta',
      score,
      label: 'Alta / Cañera',
      icon: '🔥',
      hexColor: '#a16207',
      bgClass: 'bg-[var(--acc)]/15',
      textClass: 'text-[var(--acc)]/80',
      borderClass: 'border-amber-500/30'
    };
  }

  return {
    category: 'explosiva',
    score: Math.min(20, score),
    label: 'Explosiva / Clímax',
    icon: '💣',
    hexColor: '#a21caf',
    bgClass: 'bg-[var(--tentative)]/15',
    textClass: 'text-[var(--tentative)]/80',
    borderClass: 'border-[var(--tentative)]/30'
  };
}

/**
  * Analiza el repertorio ítem a ítem y genera diagnósticos de dinámica y alertas de pacing.
  */
export function analyzeSetlistEnergy(items: SetlistItem[], songs: Song[]): SetlistEnergyAnalysis {
  const points: SetlistEnergyPoint[] = [];

  let totalScore = 0;
  let songCount = 0;
  let lowEnergyCount = 0;
  let mediumEnergyCount = 0;
  let highEnergyCount = 0;
  let explosiveCount = 0;

  items.forEach((item, index) => {
    if (item.tipoItem === 'cancion' && item.songId) {
      const song = songs.find(s => s.id === item.songId);
      const info = getEnergyInfo(song);
      
      songCount++;
      totalScore += info.score;

      if (info.category === 'balada') lowEnergyCount++;
      else if (info.category === 'media') mediumEnergyCount++;
      else if (info.category === 'alta') highEnergyCount++;
      else if (info.category === 'explosiva') explosiveCount++;

      const variance = typeof song?.energiaVariacion === 'number' && Number.isFinite(song.energiaVariacion)
        ? Math.max(0, Math.min(10, song.energiaVariacion))
        : 0;

      points.push({
        index,
        item,
        song,
        isSong: true,
        title: song?.titulo || 'Canción',
        score: info.score,
        info,
        variance
      });
    } else {
      // Evento o bloque del show — el "bis" en sí es solo una marca de "aquí empieza el bis", no
      // una canción con energía propia: las canciones reales que forman el bis ya puntúan como
      // canciones normales justo después de este marcador. Ponerle un score de 20 aquí sería
      // inventar un pico que no sale de ningún dato real — por eso todos los eventos comparten el
      // mismo score de relleno bajo; el gráfico los excluye igual de la curva de energía (ver
      // isSpeechEvent en RepertorioSetlists.tsx), solo cambia el icono según el subtipo para
      // poder distinguir de un vistazo qué es cada marcador (mismos iconos que SHOW_ITEM_TYPES en
      // RepertorioSetlists.tsx — si se añade un subtipo nuevo ahí, añadirlo aquí también).
      const subtipo = item.bloqueSubtipo || 'otro';
      const ICONOS_BLOQUE: Record<string, string> = {
        header: '⚡',
        presentacion: '🎤',
        intro_tema: '🗣️',
        beatbox: '🥁',
        solo_performance: '🎸',
        cambio_instrumento: '🔧',
        chapa: '💬',
        descanso: '⏸️',
        bis: '💣',
        otro: '📌'
      };
      const isBis = subtipo === 'bis';
      const score = 4;
      points.push({
        index,
        item,
        isSong: false,
        title: item.tituloCustom || item.tipoItem || 'Evento',
        score,
        variance: 0,
        info: {
          category: 'balada',
          score,
          label: item.tituloCustom || 'Evento Show',
          icon: ICONOS_BLOQUE[subtipo] || '📌',
          hexColor: isBis ? '#a21caf' : '#64748b',
          bgClass: isBis ? 'bg-[var(--tentative)]/15' : 'bg-slate-700/30',
          textClass: isBis ? 'text-[var(--tentative)]/80' : 'text-slate-400',
          borderClass: isBis ? 'border-[var(--tentative)]/30' : 'border-slate-700/40'
        }
      });
    }
  });

  const averageEnergy = songCount > 0 ? Math.round((totalScore / songCount) * 10) / 10 : 0;

  // Detección de perfil de show
  let profileType: EnergyProfileType = 'equilibrada';
  let profileLabel = '⚡ Dinámica Equilibrada';
  let profileIcon = '⚡';

  if (songCount === 0) {
    profileType = 'equilibrada';
    profileLabel = 'Setlist Vacío';
    profileIcon = '📝';
  } else if (lowEnergyCount >= songCount * 0.6) {
    profileType = 'acustico_calma';
    profileLabel = '🌙 Acústico / Intimista';
    profileIcon = '🌙';
  } else if (highEnergyCount + explosiveCount >= songCount * 0.7) {
    profileType = 'traca_directa';
    profileLabel = '💣 Traca Directa (Alta Energía)';
    profileIcon = '💣';
  } else {
    const songPoints = points.filter(p => p.isSong);
    if (songPoints.length >= 3) {
      const firstHalfAvg = songPoints.slice(0, Math.floor(songPoints.length / 2)).reduce((a, b) => a + b.score, 0) / Math.floor(songPoints.length / 2);
      const secondHalfAvg = songPoints.slice(Math.floor(songPoints.length / 2)).reduce((a, b) => a + b.score, 0) / Math.ceil(songPoints.length / 2);

      if (secondHalfAvg - firstHalfAvg >= 3) {
        profileType = 'in_crescendo';
        profileLabel = '🔥 Show In Crescendo';
        profileIcon = '🔥';
      }
    }
  }

  // Generación de advertencias y consejos de pacing (Nivel 1: Heurístico)
  const warnings: PacingWarning[] = [];

  if (songCount > 0) {
    const songPoints = points.filter(p => p.isSong);

    // 1. Valles de energía (3+ baladas seguidas) — se guarda el tramo concreto más largo,
    // no solo el conteo, para poder señalarlo en el gráfico.
    let consecutiveLow: SetlistEnergyPoint[] = [];
    let longestLowStreak: SetlistEnergyPoint[] = [];
    songPoints.forEach(p => {
      if (p.info.category === 'balada') {
        consecutiveLow.push(p);
        if (consecutiveLow.length > longestLowStreak.length) longestLowStreak = [...consecutiveLow];
      } else {
        consecutiveLow = [];
      }
    });
    if (longestLowStreak.length >= 3) {
      // Intercalar: la canción de mayor energía del resto del setlist (que no sea ya balada) va
      // al medio del valle, partiéndolo en dos tramos más cortos en vez de uno largo.
      const streakIndices = new Set(longestLowStreak.map(p => p.index));
      const candidate = songPoints
        .filter(p => !streakIndices.has(p.index) && p.info.category !== 'balada')
        .sort((a, b) => b.score - a.score)[0];
      const midOfStreak = longestLowStreak[Math.floor(longestLowStreak.length / 2)];

      warnings.push({
        type: 'warning',
        icon: '⚠️',
        message: `Valle detectado: ${longestLowStreak.length} baladas seguidas. Considera intercalar con algo más energético.`,
        songTitles: longestLowStreak.map(p => p.title),
        suggestedReorder: candidate ? {
          fromIndex: candidate.index,
          toIndex: midOfStreak.index,
          description: `Intercalar "${candidate.title}" en medio del valle`
        } : undefined
      });
    }

    // 2. Arranque del show
    if (songPoints.length >= 2) {
      const opener = [songPoints[0], songPoints[1]];
      const initialAvg = (opener[0].score + opener[1].score) / 2;
      if (initialAvg <= 8) {
        // La canción de mayor energía del resto del repertorio (tras los 2 primeros) pasa a
        // ocupar la posición 2 — solo si realmente sube el promedio de apertura.
        const candidate = songPoints.slice(2).sort((a, b) => b.score - a.score)[0];
        warnings.push({
          type: 'warning',
          icon: '💤',
          message: 'Arranque suave: primeros 2 temas bajos. Considera mover algo más rápido a posición 2.',
          songTitles: opener.map(p => p.title),
          suggestedReorder: (candidate && candidate.score > opener[1].score) ? {
            fromIndex: candidate.index,
            toIndex: opener[1].index,
            description: `Mover "${candidate.title}" a la posición 2`
          } : undefined
        });
      } else if (initialAvg >= 16) {
        warnings.push({
          type: 'success',
          icon: '🔥',
          message: '✓ Arranque potente: el show engancha desde el inicio.',
          songTitles: opener.map(p => p.title)
        });
      }
    }

    // 3. Cierre del show (últimos 2 temas)
    if (songPoints.length >= 2) {
      const closer = [songPoints[songPoints.length - 2], songPoints[songPoints.length - 1]];
      const closingAvg = (closer[0].score + closer[1].score) / 2;
      if (closingAvg <= 8) {
        // La canción de mayor energía del setlist (que no sea ya parte del cierre) pasa al
        // final absoluto de items — no solo al final de songPoints, por si hay un bis/evento
        // después de la última canción.
        const candidate = songPoints.slice(0, songPoints.length - 2).sort((a, b) => b.score - a.score)[0];
        warnings.push({
          type: 'tip',
          icon: '💡',
          message: 'Cierre débil: últimos temas en balada. Termina en explosiva para que la gente se vaya energizada.',
          songTitles: closer.map(p => p.title),
          suggestedReorder: (candidate && candidate.score > closingAvg) ? {
            fromIndex: candidate.index,
            toIndex: items.length - 1,
            description: `Mover "${candidate.title}" al cierre`
          } : undefined
        });
      } else if (closingAvg >= 16) {
        warnings.push({
          type: 'success',
          icon: '💣',
          message: '✓ Cierre potente: el show termina en fuego.',
          songTitles: closer.map(p => p.title)
        });
      }
    }

    // 4. Demasiadas medias seguidas (>4)
    let consecutiveMedium: SetlistEnergyPoint[] = [];
    let longestMediumStreak: SetlistEnergyPoint[] = [];
    songPoints.forEach(p => {
      if (p.info.category === 'media') {
        consecutiveMedium.push(p);
        if (consecutiveMedium.length > longestMediumStreak.length) longestMediumStreak = [...consecutiveMedium];
      } else {
        consecutiveMedium = [];
      }
    });
    if (longestMediumStreak.length >= 5) {
      // Una canción de contraste real (balada o explosiva, no otra media) del resto del
      // repertorio se intercala en medio de la racha plana.
      const streakIndices = new Set(longestMediumStreak.map(p => p.index));
      const candidate = songPoints
        .filter(p => !streakIndices.has(p.index) && (p.info.category === 'balada' || p.info.category === 'explosiva'))
        .sort((a, b) => Math.abs(b.score - 11) - Math.abs(a.score - 11))[0]; // el de contraste más extremo primero
      const midOfStreak = longestMediumStreak[Math.floor(longestMediumStreak.length / 2)];

      warnings.push({
        type: 'warning',
        icon: '📊',
        message: `Zona plana: ${longestMediumStreak.length} canciones medias seguidas. Añade contraste (balada o explosiva).`,
        songTitles: longestMediumStreak.map(p => p.title),
        suggestedReorder: candidate ? {
          fromIndex: candidate.index,
          toIndex: midOfStreak.index,
          description: `Intercalar "${candidate.title}" en la zona plana`
        } : undefined
      });
    }

    // 5. Anticlímax: pico explosiva seguido de caída brusca
    for (let i = 0; i < songPoints.length - 2; i++) {
      if (songPoints[i].score >= 17 && songPoints[i + 1].score <= 9) {
        // Una canción de energía intermedia (la más cercana al punto medio entre pico y caída)
        // se coloca entre ambas para suavizar la transición.
        const targetEnergy = (songPoints[i].score + songPoints[i + 1].score) / 2;
        const candidate = songPoints
          .filter((_, idx) => idx !== i && idx !== i + 1)
          .sort((a, b) => Math.abs(a.score - targetEnergy) - Math.abs(b.score - targetEnergy))[0];

        warnings.push({
          type: 'tip',
          icon: '⬇️',
          message: `Post-pico: "${songPoints[i].title}" (explosiva) cae bruscamente a "${songPoints[i + 1].title}". Gradúa la bajada más suavemente.`,
          songTitles: [songPoints[i].title, songPoints[i + 1].title],
          suggestedReorder: candidate ? {
            fromIndex: candidate.index,
            toIndex: songPoints[i + 1].index,
            description: `Graduar la bajada con "${candidate.title}"`
          } : undefined
        });
        break; // Solo 1 warning de este tipo
      }
    }

    // 6. Choques armónicos entre temas consecutivos (círculo de quintas). Solo si las
    // tonalidades del repertorio parecen datos reales — si la mayoría sigue en el valor por
    // defecto sin rellenar, cualquier "choque" detectado sería ruido, no una lectura real de
    // cómo suena el repertorio.
    if (tonalidadesSonFiables(songs)) {
      let choquesReportados = 0;
      for (let i = 0; i < songPoints.length - 1 && choquesReportados < 2; i++) {
        const keyA = parseTonalidad(songPoints[i].song?.tonalidad);
        const keyB = parseTonalidad(songPoints[i + 1].song?.tonalidad);
        if (!keyA || !keyB) continue;
        if (evaluarTransicionArmonica(keyA, keyB) === 'choque') {
          warnings.push({
            type: 'tip',
            icon: '🎸',
            message: `Choque armónico: "${songPoints[i].title}" (${songPoints[i].song?.tonalidad}) a "${songPoints[i + 1].title}" (${songPoints[i + 1].song?.tonalidad}) es un salto de tonalidad brusco.`,
            songTitles: [songPoints[i].title, songPoints[i + 1].title]
          });
          choquesReportados++;
        }
      }
    }
  }

  return {
    points,
    averageEnergy,
    profileType,
    profileLabel,
    profileIcon,
    warnings,
    highEnergyCount,
    mediumEnergyCount,
    lowEnergyCount,
    explosiveCount
  };
}

/** Puntos de control (fracción de progreso 0-1, intensidad relativa 0-1) de un arco de pacing
 * "clásico" de directo: arranque moderado, subida, un pequeño respiro a media función, clímax
 * cerca del final (no justo al final, para dejar sitio a un cierre reconocible) y remate fuerte
 * aunque un pelín por debajo del pico — no es una regla rígida, es la forma de referencia contra
 * la que comparar visualmente la curva real del setlist. */
const IDEAL_CURVE_TEMPLATE: Array<[number, number]> = [
  [0, 0.5],
  [0.15, 0.62],
  [0.35, 0.48],
  [0.55, 0.7],
  [0.8, 0.95],
  [0.9, 1],
  [1, 0.82]
];

function interpolarPlantillaIdeal(fraccion: number): number {
  const f = Math.max(0, Math.min(1, fraccion));
  for (let i = 0; i < IDEAL_CURVE_TEMPLATE.length - 1; i++) {
    const [x0, y0] = IDEAL_CURVE_TEMPLATE[i];
    const [x1, y1] = IDEAL_CURVE_TEMPLATE[i + 1];
    if (f >= x0 && f <= x1) {
      const t = x1 === x0 ? 0 : (f - x0) / (x1 - x0);
      return y0 + t * (y1 - y0);
    }
  }
  return IDEAL_CURVE_TEMPLATE[IDEAL_CURVE_TEMPLATE.length - 1][1];
}

/**
 * Curva de energía "ideal" de referencia, para pintar debajo de la curva real y ver de un vistazo
 * dónde se aleja más — sin necesitar leer el texto del análisis. Es el mismo arco de pacing
 * clásico para cualquier repertorio, pero ESCALADO al rango real de energías de este setlist (no
 * a la escala fija 1-20): una banda de baladas y una de punk cañero tienen curvas ideales muy
 * distintas en términos absolutos aunque la forma del arco sea la misma — así se adapta al estilo
 * real del grupo en vez de imponer un rango que sus canciones no tienen.
 *
 * Devuelve un array alineado 1:1 con `points` (mismo índice, misma longitud) — cada evento/bloque
 * también lleva un valor, interpolado por su posición real en el show, para que la línea sea
 * continua en el gráfico igual que la curva real.
 */
export function calcularCurvaEnergiaIdeal(points: SetlistEnergyPoint[]): number[] {
  const songPoints = points.filter(p => p.isSong);
  if (songPoints.length < 2) {
    const flat = songPoints[0]?.score ?? 10;
    return points.map(() => flat);
  }

  const scores = songPoints.map(p => p.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);

  // Repertorio con muy poca variación real (casi todo a la misma energía): la curva ideal no
  // puede fingir un rango que las canciones disponibles no tienen — se aplana también, en vez de
  // dibujar una forma que ninguna combinación real de estos temas podría lograr.
  if (max - min < 2) {
    const flat = Math.round((min + max) / 2);
    return points.map(() => flat);
  }

  const totalSongs = songPoints.length;
  return points.map(p => {
    // La posición en el arco se calcula sobre el rango de CANCIONES (no eventos), para que un
    // bloque/pausa intercalado no desplace dónde "debería" caer el clímax del show.
    const songRank = songPoints.findIndex(sp => sp.index === p.index);
    const fraction = songRank === -1
      ? p.index / Math.max(1, points.length - 1)
      : (totalSongs <= 1 ? 0 : songRank / (totalSongs - 1));
    const relative = interpolarPlantillaIdeal(fraction);
    return Math.round(min + relative * (max - min));
  });
}
