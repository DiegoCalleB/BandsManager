import { Song, SetlistItem } from "../types";
import {
  parseTonalidad,
  evaluarTransicionArmonica,
  CompatibilidadArmonica,
} from "./harmonicAnalysis";
import { computeCrossfadeGains } from "./crossfade";

export type TransitionStyle = "crossfade" | "segue" | "pause";

export interface TransitionConfig {
  style: TransitionStyle;
  fadeDurationSec: number; // e.g. 3, 5, 8
  tailDurationSec: number; // Duration of Song A tail to play (e.g. 8s)
  headDurationSec: number; // Duration of Song B head to play (e.g. 8s)
  pauseDurationSec: number; // For pause mode (e.g. 2s)
}

export const DEFAULT_TRANSITION_CONFIG: TransitionConfig = {
  style: "crossfade",
  fadeDurationSec: 5,
  tailDurationSec: 8,
  headDurationSec: 8,
  pauseDurationSec: 2,
};

export interface TransitionTimeline {
  totalDurationSec: number;
  songAStartSec: number;
  songAEndSec: number;
  songBStartSec: number;
  songBEndSec: number;
  crossfadeStartSec: number;
  crossfadeEndSec: number;
}

export function computeTransitionTimeline(
  config: TransitionConfig = DEFAULT_TRANSITION_CONFIG,
): TransitionTimeline {
  const {
    style,
    fadeDurationSec,
    tailDurationSec,
    headDurationSec,
    pauseDurationSec,
  } = config;

  if (style === "segue") {
    // Song A plays tail, then Song B plays head immediately with 0s overlap
    return {
      totalDurationSec: tailDurationSec + headDurationSec,
      songAStartSec: 0,
      songAEndSec: tailDurationSec,
      songBStartSec: tailDurationSec,
      songBEndSec: tailDurationSec + headDurationSec,
      crossfadeStartSec: tailDurationSec,
      crossfadeEndSec: tailDurationSec,
    };
  }

  if (style === "pause") {
    // Song A plays tail, then pause, then Song B plays head
    const songAEnd = tailDurationSec;
    const songBStart = songAEnd + pauseDurationSec;
    return {
      totalDurationSec: songBStart + headDurationSec,
      songAStartSec: 0,
      songAEndSec: songAEnd,
      songBStartSec: songBStart,
      songBEndSec: songBStart + headDurationSec,
      crossfadeStartSec: songAEnd,
      crossfadeEndSec: songBStart,
    };
  }

  // Crossfade: Song B starts before Song A ends by fadeDurationSec
  const effectiveFade = Math.min(
    fadeDurationSec,
    tailDurationSec,
    headDurationSec,
  );
  const songAEnd = tailDurationSec;
  const songBStart = Math.max(0, songAEnd - effectiveFade);
  const songBEnd = songBStart + headDurationSec;

  return {
    totalDurationSec: songBEnd,
    songAStartSec: 0,
    songAEndSec: songAEnd,
    songBStartSec: songBStart,
    songBEndSec: songBEnd,
    crossfadeStartSec: songBStart,
    crossfadeEndSec: songAEnd,
  };
}

export interface TransitionGains {
  gainA: number;
  gainB: number;
  isPlayingA: boolean;
  isPlayingB: boolean;
  isCrossfading: boolean;
  isPausedInterval: boolean;
}

export function getTransitionGains(
  currentTimeSec: number,
  timeline: TransitionTimeline,
  config: TransitionConfig = DEFAULT_TRANSITION_CONFIG,
): TransitionGains {
  const clampedTime = Math.max(
    0,
    Math.min(timeline.totalDurationSec, currentTimeSec),
  );

  const isPlayingA =
    clampedTime >= timeline.songAStartSec &&
    clampedTime <= timeline.songAEndSec;
  const isPlayingB =
    clampedTime >= timeline.songBStartSec &&
    clampedTime <= timeline.songBEndSec;

  if (config.style === "pause") {
    const isPaused =
      clampedTime > timeline.songAEndSec &&
      clampedTime < timeline.songBStartSec;
    return {
      gainA: isPlayingA ? 1 : 0,
      gainB: isPlayingB ? 1 : 0,
      isPlayingA,
      isPlayingB,
      isCrossfading: false,
      isPausedInterval: isPaused,
    };
  }

  if (config.style === "segue") {
    return {
      gainA: clampedTime < timeline.songAEndSec ? 1 : 0,
      gainB: clampedTime >= timeline.songBStartSec ? 1 : 0,
      isPlayingA,
      isPlayingB,
      isCrossfading: false,
      isPausedInterval: false,
    };
  }

  // Crossfade mode
  const inFadeWindow =
    clampedTime >= timeline.crossfadeStartSec &&
    clampedTime <= timeline.crossfadeEndSec;
  const fadeDuration = timeline.crossfadeEndSec - timeline.crossfadeStartSec;

  let gainA = 0;
  let gainB = 0;

  if (clampedTime < timeline.crossfadeStartSec) {
    gainA = 1;
    gainB = 0;
  } else if (clampedTime > timeline.crossfadeEndSec) {
    gainA = 0;
    gainB = 1;
  } else if (fadeDuration > 0) {
    const elapsedInFade = (clampedTime - timeline.crossfadeStartSec) * 1000;
    const fadeGains = computeCrossfadeGains(elapsedInFade, fadeDuration * 1000);
    gainA = fadeGains.fromGain;
    gainB = fadeGains.toGain;
  } else {
    gainA = 0;
    gainB = 1;
  }

  return {
    gainA,
    gainB,
    isPlayingA,
    isPlayingB,
    isCrossfading: inFadeWindow,
    isPausedInterval: false,
  };
}

export interface TransitionPro {
  id: string;
  title: string;
  detail: string;
  category: "armonia" | "ritmo" | "energia" | "puesta_en_escena";
  impact: "alto" | "medio" | "leve";
}

export interface TransitionCon {
  id: string;
  title: string;
  detail: string;
  category: "armonia" | "ritmo" | "energia" | "logistica";
  severity: "critico" | "aviso" | "leve";
}

export interface TransitionVerdict {
  status: "excelente" | "buena" | "precaucion" | "desaconsejada";
  badgeLabel: string;
  badgeClass: string;
  summary: string;
  artisticIntent: string;
}

export interface TransitionDiagnosis {
  scorePercent: number; // 0-100%
  verdict: TransitionVerdict;
  porQueSi: TransitionPro[];
  porQueNo: TransitionCon[];
  stageRecommendations: string[];
  harmonyStatus: CompatibilidadArmonica | "desconocida";
  harmonyDescription: string;
  bpmDelta: number | null;
  bpmDescription: string;
  energyDelta: number | null;
  energyDescription: string;
  tips: string[];
  recommendedStyle: TransitionStyle;
}

export function diagnoseTransition(
  songA: Song,
  songB: Song,
): TransitionDiagnosis {
  const keyA = parseTonalidad(songA.tonalidad);
  const keyB = parseTonalidad(songB.tonalidad);
  const harmony =
    keyA && keyB ? evaluarTransicionArmonica(keyA, keyB) : "desconocida";

  const bpmA =
    typeof songA.bpm === "number" && songA.bpm > 0 ? songA.bpm : null;
  const bpmB =
    typeof songB.bpm === "number" && songB.bpm > 0 ? songB.bpm : null;
  const bpmDelta = bpmA !== null && bpmB !== null ? bpmB - bpmA : null;

  const energyA = typeof songA.energia === "number" ? songA.energia : null;
  const energyB = typeof songB.energia === "number" ? songB.energia : null;
  const energyDelta =
    energyA !== null && energyB !== null ? energyB - energyA : null;

  const porQueSi: TransitionPro[] = [];
  const porQueNo: TransitionCon[] = [];
  const stageRecommendations: string[] = [];
  const tips: string[] = [];

  let score = 80;
  let recommendedStyle: TransitionStyle = "crossfade";

  // --- 1. HARMONY & TONALITY ANALYSIS ---
  let harmonyDescription =
    "Tonalidades compatibles o sin conflicto perceptible.";
  const tonoAStr = songA.tonalidad || "sin tono";
  const tonoBStr = songB.tonalidad || "sin tono";

  if (harmony === "identica") {
    harmonyDescription = `Misma tonalidad (${tonoAStr}) — Enlace tonal perfecto y continuo.`;
    score += 15;
    porQueSi.push({
      id: "pro-harm-identica",
      title: `Continuidad Tonal Impecable (${tonoAStr})`,
      detail: `Ambas canciones comparten el centro tonal. Permite fundidos largos o entradas directas sin que el cantante o los instrumentos pierdan la referencia de afinación.`,
      category: "armonia",
      impact: "alto",
    });
    porQueNo.push({
      id: "con-harm-monotonia",
      title: "Riesgo de fatiga tonal si no hay contraste",
      detail:
        "Dos temas consecutivos en la misma tonalidad pueden sentirse monótonos si la instrumentación o ritmo no aportan un cambio de color evidente.",
      category: "armonia",
      severity: "leve",
    });
    stageRecommendations.push(
      `💡 Al terminar "${songA.titulo}", mantén resonando el acorde de ${tonoAStr} con reverb mientras entra la batería de "${songB.titulo}".`,
    );
  } else if (harmony === "compatible") {
    harmonyDescription = `Tonalidades vecinas (${tonoAStr} ➔ ${tonoBStr}) — Modulación muy natural (círculo de quintas / tono relativo).`;
    score += 12;
    porQueSi.push({
      id: "pro-harm-compatible",
      title: `Modulación Armónica Elegante (${tonoAStr} ➔ ${tonoBStr})`,
      detail: `La relación de quintas o relativo mayor/menor refresca el oído del público sin saltos ásperos, enriqueciendo el viaje emocional del concierto.`,
      category: "armonia",
      impact: "alto",
    });
  } else if (harmony === "neutra") {
    harmonyDescription = `Modulación moderada (${tonoAStr} ➔ ${tonoBStr}) — Transición estándar con cambio de color.`;
    porQueSi.push({
      id: "pro-harm-neutra",
      title: `Cambio de color modal (${tonoAStr} ➔ ${tonoBStr})`,
      detail: `Marca con claridad la separación entre dos bloques del repertorio, evitando sensación de monotonía.`,
      category: "armonia",
      impact: "medio",
    });
    porQueNo.push({
      id: "con-harm-neutra",
      title: "Requiere corte seco o compás de pausa",
      detail:
        "Al no ser tonos contiguos, un fundido prolongado puede generar choque en acordes suspendidos.",
      category: "armonia",
      severity: "leve",
    });
  } else if (harmony === "choque") {
    harmonyDescription = `⚡ Choque armónico disonante (${tonoAStr} ➔ ${tonoBStr}) — Conflicto tonal (semitono / tritono).`;
    score -= 30;
    recommendedStyle = "pause";

    porQueNo.push({
      id: "con-harm-choque",
      title: `⚡ Conflicto Disonante Severo (${tonoAStr} ➔ ${tonoBStr})`,
      detail: `Las escalas de ambas canciones colisionan (distancia de semitono o tritono). Si se solapan notas o acordes con delay/reverb, sonará desafinado o sucio.`,
      category: "armonia",
      severity: "critico",
    });
    porQueNo.push({
      id: "con-harm-afinacion-voz",
      title: "Peligro de entrada vocal desafinada",
      detail:
        "El cantante retendrá la memoria auditiva del acorde anterior y tendrá dificultades para clavar la primera nota del verso 1.",
      category: "armonia",
      severity: "aviso",
    });
    porQueSi.push({
      id: "pro-harm-tension",
      title: "Ruptura dramática si se usa con pausa o charla",
      detail:
        "Si se limpia la reverberación o se introduce con una breve presentación, el contraste de tono produce un reseteo auditivo total.",
      category: "puesta_en_escena",
      impact: "medio",
    });

    stageRecommendations.push(
      `🛑 ¡No hagas fundido! Deja apagar completamente los platillos y delays de "${songA.titulo}" durante 2-3 segundos antes de atacar "${songB.titulo}".`,
    );
    stageRecommendations.push(
      `🎤 El cantante o instrumentista solista debe pedir referencia de tono con un golpe sutil o nota pedal.`,
    );
    tips.push(
      "Existe un choque armónico: se recomienda dejar apagar el acorde final o insertar un redoble/chapa antes de arrancar.",
    );
  }

  // --- 2. BPM / TEMPO ANALYSIS ---
  let bpmDescription = "Tempo similar entre ambos temas.";
  if (bpmDelta !== null) {
    const absBpm = Math.abs(bpmDelta);
    if (absBpm <= 4) {
      bpmDescription = `Mismo tempo o variación mínima (${bpmA} ➔ ${bpmB} BPM, ${bpmDelta >= 0 ? "+" : ""}${bpmDelta} BPM) — Empalme rítmico directo.`;
      score += 8;
      porQueSi.push({
        id: "pro-bpm-sync",
        title: `Inercia Rítmica Continua (Δ ${Math.abs(bpmDelta)} BPM)`,
        detail: `El público no perderá el paso de baile ni el cabeceo. Ideal para encadenar sin ninguna pausa (modo Segue).`,
        category: "ritmo",
        impact: "alto",
      });
      if (harmony !== "choque") {
        recommendedStyle = "segue";
        stageRecommendations.push(
          `🥁 El batería puede mantener el bombo a negras o el charles abierto para empalmar ambos temas sin frenar.`,
        );
      }
    } else if (bpmDelta >= 5 && bpmDelta <= 18) {
      bpmDescription = `Aceleración suave (+${bpmDelta} BPM: ${bpmA} ➔ ${bpmB} BPM) — Empuja el dinamismo hacia arriba.`;
      score += 5;
      porQueSi.push({
        id: "pro-bpm-aceleracion",
        title: `Aceleración Dinámica Orgánica (+${bpmDelta} BPM)`,
        detail: `Eleva la pulsación y el entusiasmo del público de manera progresiva y natural.`,
        category: "ritmo",
        impact: "medio",
      });
      porQueNo.push({
        id: "con-bpm-acel-control",
        title: "Exige precisión en la cuenta de entrada",
        detail:
          "El batería debe marcar con firmeza el nuevo tempo para que toda la banda entre al unísono sin arrastrar el tempo previo.",
        category: "ritmo",
        severity: "leve",
      });
    } else if (bpmDelta <= -5 && bpmDelta >= -18) {
      bpmDescription = `Deceleración suave (${bpmDelta} BPM: ${bpmA} ➔ ${bpmB} BPM) — Asienta el ritmo de forma controlada.`;
      porQueSi.push({
        id: "pro-bpm-decel-suave",
        title: `Asentamiento del Groove (${bpmDelta} BPM)`,
        detail: `Permite afianzar un ritmo más pesado, funky o íntimo tras un pasaje veloz.`,
        category: "ritmo",
        impact: "medio",
      });
    } else if (bpmDelta > 18) {
      bpmDescription = `Salto de tempo pronunciado (+${bpmDelta} BPM: ${bpmA} ➔ ${bpmB} BPM).`;
      score -= 15;
      porQueSi.push({
        id: "pro-bpm-salto-adrenalina",
        title: `Inyección de Adrenalina Sorpresiva (+${bpmDelta} BPM)`,
        detail: `Un cambio de marcha radical puede encender la pista instantáneamente si el primer compás entra con pegada contundente.`,
        category: "puesta_en_escena",
        impact: "alto",
      });
      porQueNo.push({
        id: "con-bpm-salto-descolocacion",
        title: `Peligro de descolocar el baile del público (+${bpmDelta} BPM)`,
        detail: `El público que estaba bailando al tempo anterior sufrirá un freno involuntario si el cambio es súbito y no se anticipa visualmente.`,
        category: "ritmo",
        severity: "aviso",
      });
      stageRecommendations.push(
        `🥁 Cuenta de baquetas obligatoria: marcar 4 golpes secos para ordenar el salto de ${bpmA} a ${bpmB} BPM.`,
      );
      tips.push(
        `Salto de tempo de +${bpmDelta} BPM: el batería debe marcar 4 tiempos de baqueta para ordenar la entrada.`,
      );
    } else if (bpmDelta < -18) {
      bpmDescription = `Frenazo de tempo pronunciado (${bpmDelta} BPM: ${bpmA} ➔ ${bpmB} BPM).`;
      score -= 15;
      porQueSi.push({
        id: "pro-bpm-contraste-intimo",
        title: "Apertura hacia momento íntimo o emotivo",
        detail:
          "Rompe la velocidad para enfocar la atención en la letra, el timbre de voz o un arreglo acústico.",
        category: "energia",
        impact: "medio",
      });
      porQueNo.push({
        id: "con-bpm-frenazo",
        title: `Riesgo de "bajón de pista" (${bpmDelta} BPM)`,
        detail:
          "Una caída abrupta de tempo puede desinflar la emoción colectiva si el tema anterior había dejado a la sala en el clímax.",
        category: "ritmo",
        severity: "aviso",
      });
    }
  }

  // --- 3. ENERGY & DYNAMICS ANALYSIS ---
  let energyDescription = "Nivel de energía parejo.";
  if (energyDelta !== null) {
    if (energyDelta >= 5) {
      energyDescription = `Explosión de energía (+${energyDelta}/20) — Ideal para levantar al público o iniciar el bloque álgido.`;
      porQueSi.push({
        id: "pro-energy-explosion",
        title: `Crescendo Dramático del Show (+${energyDelta}/20)`,
        detail: `Empuja la curva del concierto hacia arriba con fuerza, generando un momento memorable de entrega y potencia.`,
        category: "energia",
        impact: "alto",
      });
    } else if (energyDelta <= -5) {
      energyDescription = `Bajada notable de energía (${energyDelta}/20) — Momento íntimo o balada tras un tema enérgico.`;
      porQueSi.push({
        id: "pro-energy-valle",
        title: `Respiro Dinámico & Contraste (${energyDelta}/20)`,
        detail: `Permite a la audiencia reposar los sentidos y recupera dinámica para que los futuros temas rápidos vuelvan a sonar masivos.`,
        category: "energia",
        impact: "medio",
      });
      porQueNo.push({
        id: "con-energy-caida",
        title: "Posible enfriamiento de la sala si no se gestiona",
        detail:
          "Pasar de máxima energía a mínima sin una justificación de puesta en escena puede hacer que el público empiece a hablar.",
        category: "energia",
        severity: "aviso",
      });
      stageRecommendations.push(
        `🗣️ Momento idóneo para que el cantante hable 30 segundos con el público o presente la historia del tema.`,
      );
    } else {
      energyDescription = `Energía equilibrada (${energyA}/20 ➔ ${energyB}/20, ${energyDelta >= 0 ? "+" : ""}${energyDelta}).`;
      porQueSi.push({
        id: "pro-energy-estabilidad",
        title: `Consistencia de Bloque (${energyA}/20 ➔ ${energyB}/20)`,
        detail: `Mantiene la atmósfera establecida sin altibajos descontrolados.`,
        category: "energia",
        impact: "medio",
      });
    }

    if (
      energyA !== null &&
      energyB !== null &&
      energyA >= 15 &&
      energyB >= 15
    ) {
      porQueNo.push({
        id: "con-energy-fatiga",
        title: "Alta exigencia física y vocal acumulada",
        detail:
          "Dos canciones seguidas a máxima intensidad pueden agotar la voz del cantante y los brazos del batería si no hay un respiro después.",
        category: "logistica",
        severity: "aviso",
      });
    }
  }

  if (tips.length === 0) {
    tips.push(
      "Transición limpia: el fundido cruzado (crossfade) o segue directo funcionará con gran fluidez en directo.",
    );
  }

  const clampedScore = Math.max(20, Math.min(100, score));

  // Determine Verdict & Artistic Intent
  let verdictStatus: TransitionVerdict["status"] = "buena";
  let badgeLabel = "Transición Favorable";
  let badgeClass = "bg-[var(--ok)]/15 text-[var(--ok)]";
  let summary = "Enlace recomendado con buen flujo musical y dinámico.";
  let artisticIntent =
    "Mantiene la atención y enriquece la narrativa del concierto.";

  if (clampedScore >= 90) {
    verdictStatus = "excelente";
    badgeLabel = "🟢 Enlace Impecable";
    badgeClass = "bg-[var(--ok)]/20 text-[var(--ok)]";
    summary =
      "Transición perfecta en armonía y tempo. Flujo ideal para sonar como una banda de primer nivel.";
    artisticIntent =
      "Conexión orgánica sin fisuras que maximiza el impacto en directo.";
  } else if (clampedScore >= 70) {
    verdictStatus = "buena";
    badgeLabel = "🟡 Recomendada con Matices";
    badgeClass = "bg-[var(--acc)]/20 text-[var(--ink-2)]";
    summary =
      "Transición sólida. Requiere cuidar la entrada o el remate de platos según las recomendaciones.";
    artisticIntent =
      "Aporta dinamismo y variación al show con un mínimo control de directo.";
  } else if (clampedScore >= 50) {
    verdictStatus = "precaucion";
    badgeLabel = "🟠 Riesgosa / Requiere Ajuste";
    badgeClass = "bg-[var(--acc)]/20 text-[var(--acc)]/80";
    summary =
      "Existe un salto notable de tempo o tensión armónica. Conviene prepararla en el local de ensayo.";
    artisticIntent =
      "Efecto de contraste fuerte; debe ejecutarse con determinación.";
  } else {
    verdictStatus = "desaconsejada";
    badgeLabel = "🔴 Choque / Desaconsejada Directa";
    badgeClass = "bg-[var(--alert)]/20 text-[var(--alert)]";
    summary =
      "Choque armónico o corte dinámico severo. Se aconseja meter un bloque hablado o cambiar el orden.";
    artisticIntent = "Riesgo alto de desafinación o desconexión del público.";
  }

  const verdict: TransitionVerdict = {
    status: verdictStatus,
    badgeLabel,
    badgeClass,
    summary,
    artisticIntent,
  };

  return {
    scorePercent: clampedScore,
    verdict,
    porQueSi,
    porQueNo,
    stageRecommendations,
    harmonyStatus: harmony,
    harmonyDescription,
    bpmDelta,
    bpmDescription,
    energyDelta,
    energyDescription,
    tips,
    recommendedStyle,
  };
}

export function resolveSongAudioUrl(song: Song | null | undefined): string {
  if (!song) return "";
  const s = song as any;
  if (song.audioPrincipalUrl && typeof song.audioPrincipalUrl === "string")
    return song.audioPrincipalUrl;
  if (s.audio_principal_url && typeof s.audio_principal_url === "string")
    return s.audio_principal_url;
  if (song.audioUrl && typeof song.audioUrl === "string") return song.audioUrl;
  if (s.audio_url && typeof s.audio_url === "string") return s.audio_url;
  if (s.audio && typeof s.audio === "string") return s.audio;
  if (s.fileUrl && typeof s.fileUrl === "string") return s.fileUrl;
  if (s.file_url && typeof s.file_url === "string") return s.file_url;
  if (
    s.url &&
    typeof s.url === "string" &&
    (s.url.includes(".mp3") ||
      s.url.includes(".wav") ||
      s.url.includes(".m4a") ||
      s.url.includes("indexeddb:") ||
      s.url.includes("drive.google.com"))
  )
    return s.url;
  if (s.demoAudioUrl && typeof s.demoAudioUrl === "string")
    return s.demoAudioUrl;
  if (s.backingTrackUrl && typeof s.backingTrackUrl === "string")
    return s.backingTrackUrl;
  if (s.previewUrl && typeof s.previewUrl === "string") return s.previewUrl;
  if (s.streamUrl && typeof s.streamUrl === "string") return s.streamUrl;
  if (
    song.audioIdeas &&
    Array.isArray(song.audioIdeas) &&
    song.audioIdeas.length > 0
  ) {
    for (const idea of song.audioIdeas) {
      if (idea?.audioUrl) return idea.audioUrl;
      if ((idea as any)?.audio_url) return (idea as any).audio_url;
    }
  }
  if (
    s.audio_ideas &&
    Array.isArray(s.audio_ideas) &&
    s.audio_ideas.length > 0
  ) {
    for (const idea of s.audio_ideas) {
      if (idea?.audioUrl) return idea.audioUrl;
      if (idea?.audio_url) return idea.audio_url;
    }
  }
  return "";
}

export interface StudioSampleTrack {
  id: string;
  name: string;
  genre: string;
  bpm: number;
  tonalidad: string;
  url: string;
  description: string;
}

export const STUDIO_SAMPLE_TRACKS: StudioSampleTrack[] = [
  {
    id: "sample_01",
    name: "Groove de Apertura",
    genre: "Rock Funk / Enérgico",
    bpm: 128,
    tonalidad: "Re Mayor (D)",
    url: "/audio/samples/sample_01_groove_apertura.mp3",
    description:
      "Batería contundente con bajo marcado y guitarras rítmicas brillantes",
  },
  {
    id: "sample_02",
    name: "Balada de Medianoche",
    genre: "Pop Balada / Íntimo",
    bpm: 85,
    tonalidad: "La Menor (Am)",
    url: "/audio/samples/sample_02_balada_medianoche.mp3",
    description: "Arpegios suaves de piano y pads ambientales cálidos",
  },
  {
    id: "sample_03",
    name: "Fuego en el Asfalto",
    genre: "Hard Rock / Alta Energía",
    bpm: 140,
    tonalidad: "Mi Menor (Em)",
    url: "/audio/samples/sample_03_fuego_asfalto.mp3",
    description: "Riff distorsionado potente con redobles y dinamismo alto",
  },
  {
    id: "sample_04",
    name: "Brisa Mediterránea",
    genre: "Acústico / Rumba Fusión",
    bpm: 110,
    tonalidad: "Sol Mayor (G)",
    url: "/audio/samples/sample_04_brisa_mediterranea.mp3",
    description: "Guitarras de palo, palmas y ritmo bailable sincopado",
  },
  {
    id: "sample_05",
    name: "Cierre Triunfal",
    genre: "Himno / Épico",
    bpm: 132,
    tonalidad: "Do Mayor (C)",
    url: "/audio/samples/sample_05_cierre_triunfal.mp3",
    description:
      "Estribillo apoteósico con metales, coros y clímax de concierto",
  },
];

export function getSampleTrackForSong(
  song: Song | null | undefined,
  fallbackIndex = 0,
): StudioSampleTrack {
  if (!song)
    return STUDIO_SAMPLE_TRACKS[fallbackIndex % STUDIO_SAMPLE_TRACKS.length];
  // Match by BPM similarity or energy
  const songBpm = song.bpm || 120;
  let bestSample = STUDIO_SAMPLE_TRACKS[0];
  let minDiff = 999;
  for (const sample of STUDIO_SAMPLE_TRACKS) {
    const diff = Math.abs(sample.bpm - songBpm);
    if (diff < minDiff) {
      minDiff = diff;
      bestSample = sample;
    }
  }
  return bestSample;
}
