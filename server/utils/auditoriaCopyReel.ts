/**
 * Auditoría determinista del copy de un Reel (Fase 3 del plan): lo que se puede comprobar sin
 * IA se comprueba sin IA, en 0 ms y siempre igual. El juez LLM (`services/copyPerfecto.ts`)
 * solo decide entre candidatos que ya pasaron por aquí.
 *
 * Reutiliza los detectores de estilo de los pitches (`auditPitchQuality`: palabras de IA,
 * guiones largos) y añade lo propio de redes: límites por plataforma, hashtags, cebo de
 * engagement penalizado por Meta y clichés de reels.
 */
import { auditPitchQuality } from "./promptSafety.js";
import { BANNED_AI_WORDS as PALABRAS_IA_GUIA } from "./promptGuidelines.js";

/**
 * El repo tiene dos listas de palabras de IA (promptSafety y promptGuidelines) que se han ido
 * separando. auditPitchQuality solo mira la primera; aquí se mira también la segunda.
 */
function palabrasIaExtra(texto: string): string[] {
  const minus = texto.toLowerCase();
  return PALABRAS_IA_GUIA.filter((w) => new RegExp(`(^|[^\\p{L}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[^\\p{L}]|$)`, "iu").test(minus));
}

export interface CopyReel {
  hookText: string;
  /** Pie de Instagram Reels. */
  recommendedCopy: string;
  copyTikTok: string;
  copyYouTube: string;
  copyFacebook: string;
  hashtags: string[];
}

export type CodigoCopy =
  | "hook_vacio"
  | "hook_largo"
  | "copy_vacio"
  | "instagram_largo"
  | "youtube_largo"
  | "arranque_cortado"
  | "hashtag_en_texto"
  | "hashtags_numero"
  | "cebo_engagement"
  | "cliche"
  | "palabra_ia"
  | "guion_largo"
  | "emojis";

export interface ProblemaCopy {
  campo: keyof CopyReel;
  codigo: CodigoCopy;
  gravedad: "error" | "aviso";
  mensaje: string;
}

export interface AuditoriaCopy {
  /** 0-100. Cada error resta 20 y cada aviso 7. */
  puntuacion: number;
  /** Sin errores (los avisos no lo impiden). */
  apto: boolean;
  problemas: ProblemaCopy[];
}

export const LIMITES = {
  hookPalabras: 8,
  instagramCaracteres: 2200,
  /** Lo que Instagram enseña antes de "más". */
  instagramVisible: 125,
  youtubeCaracteres: 60,
  hashtagsMin: 3,
  hashtagsMax: 8,
  emojisMax: 2
} as const;

/** Pedir la interacción a cambio de nada: Meta lo detecta y reduce el alcance. */
// Sin \b tras "sí": en JS \b no considera letra la "í", así que "Comenta SÍ" no casaba.
const CEBO = /(^|[^\p{L}])(comenta\s+(s[ií]|un|con|si)(?=[^\p{L}]|$)|dale\s+(a\s+)?(like|me\s+gusta)|etiqueta\s+a|comparte\s+si|doble\s+tap|s[ií]gue(nos|me)\s+para\s+m[aá]s)/iu;
/** Comodines de reels que la regla de redacción ya prohíbe (reelStrategy.buildReglasDeRedaccion). */
const CLICHES = /(momento\s+[ée]pico|momentazo|no\s+te\s+(lo\s+)?pierdas|puro\s+fuego|hola\s+a\s+todos|esto\s+es\s+brutal)/i;
const HASHTAG = /(^|\s)#[\p{L}\p{N}_]+/gu;
const EMOJI = /\p{Extended_Pictographic}/gu;

const TEXTOS: Array<keyof CopyReel> = ["hookText", "recommendedCopy", "copyTikTok", "copyYouTube", "copyFacebook"];

export function auditarCopyReel(c: CopyReel): AuditoriaCopy {
  const problemas: ProblemaCopy[] = [];
  const error = (campo: keyof CopyReel, codigo: CodigoCopy, mensaje: string) => problemas.push({ campo, codigo, gravedad: "error", mensaje });
  const aviso = (campo: keyof CopyReel, codigo: CodigoCopy, mensaje: string) => problemas.push({ campo, codigo, gravedad: "aviso", mensaje });

  const palabrasHook = c.hookText.trim().split(/\s+/).filter(Boolean).length;
  if (palabrasHook === 0) error("hookText", "hook_vacio", "Falta el rótulo de enganche.");
  else if (palabrasHook > LIMITES.hookPalabras) error("hookText", "hook_largo", `El rótulo tiene ${palabrasHook} palabras; en 2 segundos se leen como mucho ${LIMITES.hookPalabras}.`);

  if (!c.recommendedCopy.trim()) error("recommendedCopy", "copy_vacio", "Falta el pie de Instagram.");
  if (c.recommendedCopy.length > LIMITES.instagramCaracteres) error("recommendedCopy", "instagram_largo", `El pie supera los ${LIMITES.instagramCaracteres} caracteres de Instagram.`);
  if (c.copyYouTube.length > LIMITES.youtubeCaracteres) error("copyYouTube", "youtube_largo", `El título de Shorts tiene ${c.copyYouTube.length} caracteres; más de ${LIMITES.youtubeCaracteres} se corta en el móvil.`);

  // Lo visible antes de "más" tiene que cerrar una idea: si se corta a media frase, nadie lo abre.
  const visible = c.recommendedCopy.slice(0, LIMITES.instagramVisible);
  if (c.recommendedCopy.length > LIMITES.instagramVisible && !/[.!?¿¡…\n]/.test(visible)) {
    aviso("recommendedCopy", "arranque_cortado", `Los primeros ${LIMITES.instagramVisible} caracteres (lo que se ve sin pulsar "más") no cierran ninguna frase.`);
  }

  const n = c.hashtags.length;
  if (n < LIMITES.hashtagsMin || n > LIMITES.hashtagsMax) {
    aviso("hashtags", "hashtags_numero", `Hay ${n} hashtags; lo que mejor funciona son ${LIMITES.hashtagsMin}-${LIMITES.hashtagsMax}.`);
  }

  for (const campo of TEXTOS) {
    const texto = String(c[campo] || "");
    if (!texto) continue;
    if (campo !== "hookText" && HASHTAG.test(texto)) error(campo, "hashtag_en_texto", "Hay hashtags dentro del texto: van aparte.");
    HASHTAG.lastIndex = 0;
    if (CEBO.test(texto)) error(campo, "cebo_engagement", "Pide la interacción a cambio de nada (\"comenta SÍ\", \"dale like\"…): Meta lo penaliza.");
    if (CLICHES.test(texto)) error(campo, "cliche", "Usa un comodín de reels (\"momento épico\", \"no te lo pierdas\"…): di qué pasa de verdad.");
    const estilo = auditPitchQuality(texto);
    const palabrasIa = [...new Set([...estilo.bannedWordsFound.map((w) => w.word), ...palabrasIaExtra(texto)])];
    if (palabrasIa.length) error(campo, "palabra_ia", `Suena a texto de IA: ${palabrasIa.join(", ")}.`);
    if (estilo.emDashesFound > 0) aviso(campo, "guion_largo", "El guion largo (—) delata texto generado: usa coma o punto.");
    const emojis = texto.match(EMOJI)?.length || 0;
    if (emojis > LIMITES.emojisMax) aviso(campo, "emojis", `${emojis} emojis; con ${LIMITES.emojisMax} basta.`);
  }

  const errores = problemas.filter((p) => p.gravedad === "error").length;
  const avisos = problemas.length - errores;
  return { puntuacion: Math.max(0, 100 - errores * 20 - avisos * 7), apto: errores === 0, problemas };
}

function normalizarHashtag(h: string): string {
  const limpio = String(h || "").replace(/\s+/g, "").replace(/^#+/, "");
  return limpio ? `#${limpio}` : "";
}

function recortarSinPartir(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max + 1).replace(/\s+\S*$/, "");
  return (corte || texto.slice(0, max)).trim();
}

/**
 * Arreglos mecánicos que no necesitan IA: hashtags del texto a la lista, hashtags normalizados
 * y sin duplicados (máx. 8) y título de Shorts recortado sin partir palabras. Idempotente.
 */
export function sanearCopyReel(c: CopyReel): CopyReel {
  const extraidos: string[] = [];
  const sinHashtags = (t: string) =>
    t
      .replace(HASHTAG, (m) => {
        extraidos.push(m.trim());
        return "";
      })
      .replace(/[ \t]+\n/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();

  const textos = {
    recommendedCopy: sinHashtags(c.recommendedCopy),
    copyTikTok: sinHashtags(c.copyTikTok),
    copyYouTube: recortarSinPartir(sinHashtags(c.copyYouTube), LIMITES.youtubeCaracteres),
    copyFacebook: sinHashtags(c.copyFacebook)
  };

  const vistos = new Set<string>();
  const hashtags = [...c.hashtags, ...extraidos]
    .map(normalizarHashtag)
    .filter((h) => h && !vistos.has(h.toLowerCase()) && vistos.add(h.toLowerCase()))
    .slice(0, LIMITES.hashtagsMax);

  return { hookText: c.hookText.trim(), ...textos, hashtags };
}
