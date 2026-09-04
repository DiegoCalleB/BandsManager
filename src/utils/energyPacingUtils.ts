import { Song, SetlistItem } from '../types';

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
      bgClass: 'bg-amber-500/15',
      textClass: 'text-amber-400',
      borderClass: 'border-amber-500/30'
    };
  }

  return {
    category: 'explosiva',
    score: Math.min(20, score),
    label: 'Explosiva / Clímax',
    icon: '💣',
    hexColor: '#a21caf',
    bgClass: 'bg-fuchsia-500/15',
    textClass: 'text-fuchsia-400',
    borderClass: 'border-fuchsia-500/30'
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
      // Evento o bloque del show
      const isBis = item.tipoItem === 'bis';
      const score = isBis ? 20 : 4;
      points.push({
        index,
        item,
        isSong: false,
        title: item.tituloCustom || item.tipoItem || 'Evento',
        score,
        variance: 0,
        info: {
          category: isBis ? 'explosiva' : 'balada',
          score,
          label: item.tituloCustom || 'Evento Show',
          icon: isBis ? '💣' : '💬',
          hexColor: isBis ? '#a21caf' : '#64748b',
          bgClass: isBis ? 'bg-fuchsia-500/15' : 'bg-slate-700/30',
          textClass: isBis ? 'text-fuchsia-400' : 'text-slate-400',
          borderClass: isBis ? 'border-fuchsia-500/30' : 'border-slate-700/40'
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

    // 1. Valles de energía (3+ baladas seguidas)
    let consecutiveLow = 0;
    let maxConsecutiveLow = 0;
    songPoints.forEach(p => {
      if (p.info.category === 'balada') {
        consecutiveLow++;
        if (consecutiveLow > maxConsecutiveLow) maxConsecutiveLow = consecutiveLow;
      } else {
        consecutiveLow = 0;
      }
    });
    if (maxConsecutiveLow >= 3) {
      warnings.push({
        type: 'warning',
        icon: '⚠️',
        message: `Valle detectado: ${maxConsecutiveLow} baladas seguidas. Considera intercalar con algo más energético.`
      });
    }

    // 2. Arranque del show
    if (songPoints.length >= 2) {
      const initialAvg = (songPoints[0].score + songPoints[1].score) / 2;
      if (initialAvg <= 8) {
        warnings.push({
          type: 'warning',
          icon: '💤',
          message: 'Arranque suave: primeros 2 temas bajos. Considera mover algo más rápido a posición 2.'
        });
      } else if (initialAvg >= 16) {
        warnings.push({
          type: 'success',
          icon: '🔥',
          message: '✓ Arranque potente: el show engancha desde el inicio.'
        });
      }
    }

    // 3. Cierre del show (últimos 2 temas)
    if (songPoints.length >= 2) {
      const closingAvg = (songPoints[songPoints.length - 2].score + songPoints[songPoints.length - 1].score) / 2;
      if (closingAvg <= 8) {
        warnings.push({
          type: 'tip',
          icon: '💡',
          message: 'Cierre débil: últimos temas en balada. Termina en explosiva para que la gente se vaya energizada.'
        });
      } else if (closingAvg >= 16) {
        warnings.push({
          type: 'success',
          icon: '💣',
          message: '✓ Cierre potente: el show termina en fuego.'
        });
      }
    }

    // 4. Demasiadas medias seguidas (>4)
    let consecutiveMedium = 0;
    let maxConsecutiveMedium = 0;
    songPoints.forEach(p => {
      if (p.info.category === 'media') {
        consecutiveMedium++;
        if (consecutiveMedium > maxConsecutiveMedium) maxConsecutiveMedium = consecutiveMedium;
      } else {
        consecutiveMedium = 0;
      }
    });
    if (maxConsecutiveMedium >= 5) {
      warnings.push({
        type: 'warning',
        icon: '📊',
        message: `Zona plana: ${maxConsecutiveMedium} canciones medias seguidas. Añade contraste (balada o explosiva).`
      });
    }

    // 5. Anticlímax: pico explosiva seguido de caída brusca
    for (let i = 0; i < songPoints.length - 2; i++) {
      if (songPoints[i].score >= 17 && songPoints[i + 1].score <= 9) {
        warnings.push({
          type: 'tip',
          icon: '⬇️',
          message: `Post-pico: "${songPoints[i].title}" (explosiva) cae bruscamente a "${songPoints[i + 1].title}". Gradúa la bajada más suavemente.`
        });
        break; // Solo 1 warning de este tipo
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
