import { validateScheduleReadiness } from "../../utils/reelsUtils";
import type { InformeCalidadClip } from "./reelsApiTypes";

export interface EntradaRevision {
  copy: string;
  fecha: string;
  hora: string;
  plataforma: string;
  /** Clip renderizado (mp4 propio) o, si no se ha renderizado, el enlace de origen. */
  videoUrl?: string;
  /** undefined = sin render; null = no se pudo medir. */
  calidad: InformeCalidadClip | null | undefined;
  derechosDeclarados: boolean;
  autoPublish: boolean;
  cuentaConectada: boolean;
  avisosCadencia: string[];
}

export interface RevisionFinal {
  /** Lo que impide programar: la persona tiene que volver a editar. */
  bloqueos: string[];
  /** Lo que no impide programar pero cambia lo que va a pasar. */
  avisos: string[];
  puedeAprobar: boolean;
  /** true solo si el worker podrá publicarlo sin que nadie haga nada. */
  saldraSolo: boolean;
}

const esMp4Propio = (url?: string): boolean => Boolean(url) && /^https?:\/\//.test(url!) && /\.mp4(\?|$)/i.test(url!) && !/youtu\.?be/.test(url!);

/**
 * Última revisión antes de programar: qué bloquea, qué avisa y si el Reel saldrá solo.
 * Los avisos solo se dan si se pidió subida automática: sin ella, no hay nada que prometer.
 */
export function prepararRevisionFinal(e: EntradaRevision): RevisionFinal {
  const bloqueos = validateScheduleReadiness({ copy: e.copy, scheduledDate: e.fecha, scheduledTime: e.hora });
  const avisos: string[] = [...e.avisosCadencia];

  let saldraSolo = e.autoPublish;
  const noSaleSolo = (motivo: string) => { saldraSolo = false; avisos.push(motivo); };

  if (e.autoPublish) {
    if (e.plataforma !== "Instagram") noSaleSolo(`${e.plataforma} todavía no se publica sola: tendrás que subirlo tú el día ${e.fecha}.`);
    if (!e.cuentaConectada) noSaleSolo(`No hay una cuenta de ${e.plataforma} conectada: no saldrá solo.`);
    if (!esMp4Propio(e.videoUrl)) noSaleSolo("El clip aún no está renderizado: renderízalo para que pueda salir solo.");
    if (!e.derechosDeclarados) noSaleSolo("Sin declarar los derechos del vídeo no se publica solo.");
    if (e.calidad === undefined || e.calidad === null) noSaleSolo("No se ha podido comprobar la calidad del clip: no se publicará solo.");
    else if (!e.calidad.aprobado) noSaleSolo(`El clip no pasó el control de calidad: ${e.calidad.bloqueantes.map((b) => b.mensaje).join(" ")}`.trim());
  }

  return { bloqueos, avisos, puedeAprobar: bloqueos.length === 0, saldraSolo };
}
