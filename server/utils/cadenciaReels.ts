/**
 * Cadencia de publicación (Fase 4 del plan): cuándo toca el próximo Reel de una banda.
 *
 * Reglas, en este orden:
 * 1. Como mucho un Reel por día y plataforma: dos el mismo día se canibalizan.
 * 2. Nunca dos clips del mismo vídeo de origen a menos de 48 h.
 * 3. La hora sale de los datos de la cuenta (seguidores conectados por hora) y, sin datos o con
 *    pocos, del fallback fijo de las 20:30. Una hora "óptima" sacada de tres puntos es ruido.
 *
 * Todo es puro: `ahora`, la zona y los posts llegan como argumento.
 */
import { instanteProgramado } from "./programacionPosts.js";
import type { SocialPost } from "../../src/types.js";

export const HORA_FALLBACK = "20:30";
export const HORAS_ENTRE_CLIPS_DEL_MISMO_VIDEO = 48;
/** Con menos seguidores conectados medidos que esto, la distribución horaria no dice nada. */
export const MIN_SEGUIDORES_PARA_HORA_REAL = 50;
const DIAS_MAX_BUSQUEDA = 30;
/** Los Reels se publican en el cuarto de hora: sale más limpio en el calendario y en los logs. */
const PASO_MINUTOS = 15;

export interface HuecoPropuesto {
  fecha: string;
  hora: string;
  /** 'datos' = hora medida en la cuenta; 'fallback' = hora genérica. Lo ve la banda. */
  origenHora: "datos" | "fallback";
  motivo: string;
}

export interface EntradaHueco {
  posts: SocialPost[];
  ahora: Date;
  zona?: string;
  plataforma: SocialPost["plataforma"];
  /** Vídeo de origen del clip que se va a programar (para la regla de las 48 h). */
  videoOrigen?: string;
  /** Vídeo de origen de cada `video_url` ya programado. */
  origenPorClip?: Record<string, string>;
  /** Seguidores conectados por hora local (0-23), según Instagram Insights. */
  seguidoresPorHora?: Record<number, number> | null;
}

/** Hora (HH:MM) con más seguidores conectados, o null si los datos no bastan. */
export function mejorHoraSegunSeguidores(porHora: Record<number, number> | null | undefined): string | null {
  if (!porHora) return null;
  const entradas = Object.entries(porHora)
    .map(([h, n]) => [Number(h), Number(n)] as const)
    .filter(([h, n]) => Number.isInteger(h) && h >= 0 && h <= 23 && Number.isFinite(n) && n >= 0);
  const total = entradas.reduce((s, [, n]) => s + n, 0);
  if (entradas.length < 12 || total < MIN_SEGUIDORES_PARA_HORA_REAL) return null;
  // Se publica ANTES del pico: el algoritmo reparte durante la primera hora, no cuando ya hay colas.
  const [pico] = entradas.reduce((mejor, e) => (e[1] > mejor[1] ? e : mejor));
  const hora = (pico + 23) % 24;
  return `${String(hora).padStart(2, "0")}:45`;
}

function fechaLocal(instante: Date, zona: string | undefined): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: zona || "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(instante);
}

function sumarDias(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + dias)).toISOString().slice(0, 10);
}

function redondearAlPaso(hora: string): string {
  const [h, m] = hora.split(":").map(Number);
  const total = Math.round((h * 60 + m) / PASO_MINUTOS) * PASO_MINUTOS;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const ESTADOS_QUE_OCUPAN: SocialPost["estado"][] = ["borrador", "aprobado", "en_cola", "publicando", "publicado"];

/** Primer hueco libre que cumple la cadencia. Siempre devuelve algo: tras 30 días sin hueco, el último intento. */
export function proponerHueco(e: EntradaHueco): HuecoPropuesto {
  const real = mejorHoraSegunSeguidores(e.seguidoresPorHora);
  const hora = redondearAlPaso(real ?? HORA_FALLBACK);
  const origenHora = real ? "datos" : "fallback";

  const ocupantes = e.posts.filter(
    (p) => p.plataforma === e.plataforma && ESTADOS_QUE_OCUPAN.includes(p.estado) && /^\d{4}-\d{2}-\d{2}$/.test(p.fecha || "")
  );
  const diasOcupados = new Set(ocupantes.map((p) => p.fecha));
  const hoy = fechaLocal(e.ahora, e.zona);

  const chocaConMismoVideo = (instante: Date): boolean => {
    if (!e.videoOrigen) return false;
    return ocupantes.some((p) => {
      const origen = p.video_url ? e.origenPorClip?.[p.video_url] : undefined;
      if (origen !== e.videoOrigen) return false;
      const otro = instanteProgramado(p.fecha, p.hora_programada, e.zona);
      return Math.abs(otro.getTime() - instante.getTime()) < HORAS_ENTRE_CLIPS_DEL_MISMO_VIDEO * 3_600_000;
    });
  };

  let ultimo = sumarDias(hoy, 1);
  for (let i = 0; i < DIAS_MAX_BUSQUEDA; i++) {
    const fecha = sumarDias(hoy, i);
    ultimo = fecha;
    if (diasOcupados.has(fecha)) continue;
    const instante = instanteProgramado(fecha, hora, e.zona);
    if (instante.getTime() <= e.ahora.getTime() + 30 * 60_000) continue;
    if (chocaConMismoVideo(instante)) continue;
    return { fecha, hora, origenHora, motivo: motivo(origenHora, hora, fecha === hoy) };
  }
  return { fecha: ultimo, hora, origenHora, motivo: "Agenda llena los próximos 30 días: revisa la cadencia antes de añadir más." };
}

function motivo(origen: HuecoPropuesto["origenHora"], hora: string, esHoy: boolean): string {
  const cuando = esHoy ? "Hoy" : "El primer día libre";
  return origen === "datos"
    ? `${cuando} a las ${hora}: justo antes del pico de seguidores conectados de tu cuenta.`
    : `${cuando} a las ${hora}: franja de mayor consumo de vídeo musical. Con datos de tu cuenta se afinará.`;
}
