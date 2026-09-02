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
      hexColor: '#38bdf8',
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
      hexColor: '#10b981',
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
      hexColor: '#f59e0b',
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
    hexColor: '#f43f5e',
    bgClass: 'bg-rose-500/15',
    textClass: 'text-rose-400',
    borderClass: 'border-rose-500/30'
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
          hexColor: isBis ? '#f43f5e' : '#64748b',
          bgClass: isBis ? 'bg-rose-500/15' : 'bg-slate-700/30',
          textClass: isBis ? 'text-rose-400' : 'text-slate-400',
          borderClass: isBis ? 'border-rose-500/30' : 'border-slate-700/40'
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

  // Generación de advertencias y consejos de pacing
  const warnings: PacingWarning[] = [];

  if (songCount > 0) {
    // 1. Verificar valles de energía consecutiva (3 o más baladas seguidas)
    let consecutiveLow = 0;
    let maxConsecutiveLow = 0;

    points.filter(p => p.isSong).forEach(p => {
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
        message: `Detección de valle de energía: hay ${maxConsecutiveLow} canciones lentas/baladas seguidas.`
      });
    }

    // 2. Verificar arranque del show
    const songPoints = points.filter(p => p.isSong);
    if (songPoints.length >= 2) {
      const initialAvg = (songPoints[0].score + songPoints[1].score) / 2;
      if (initialAvg <= 8) {
        warnings.push({
          type: 'warning',
          icon: '💤',
          message: 'Arranque de show suave: los 2 primeros temas son de energía baja.'
        });
      } else if (initialAvg >= 16) {
        warnings.push({
          type: 'success',
          icon: '🔥',
          message: 'Arranque potente: el show empieza con máxima energía.'
        });
      }
    }

    // 3. Verificar cierre del show (último tema)
    const lastSong = songPoints[songPoints.length - 1];
    if (lastSong) {
      if (lastSong.score >= 16) {
        warnings.push({
          type: 'success',
          icon: '💣',
          message: `Cierre en alto: "${lastSong.title}" remata el show en punto máximo.`
        });
      } else if (lastSong.score <= 8 && songPoints.length > 2) {
        warnings.push({
          type: 'tip',
          icon: '💡',
          message: 'Consejo: El último tema es una balada. Considera terminar con un hit o bis cañero.'
        });
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
