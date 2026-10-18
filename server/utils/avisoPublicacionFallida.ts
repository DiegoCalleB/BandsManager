/**
 * Aviso por email cuando el worker no ha podido publicar un Reel programado. Lógica pura (a quién
 * se avisa y qué dice); el envío vive en services/avisosPublicacion.ts.
 *
 * Por qué: el publicador deja el post en «fallido» con el motivo, pero eso solo se ve abriendo la
 * app. Un Reel programado para las 20:30 que no sale es el peor fallo posible porque es SILENCIOSO:
 * la banda se entera cuando ya pasó el momento.
 */
import { esEmailValido } from "./email.js";
import { escapeHtml } from "./html.js";
import { envoltorio, parrafo } from "./avisosCuentaEmail.js";

export interface PostFallido {
  plataforma: string;
  /** YYYY-MM-DD */
  fecha: string;
  /** HH:MM */
  hora?: string;
  /** Por qué no salió, en lenguaje de la banda (lo escribe el publicador). */
  motivo: string;
  /** true = no se puede publicar solo y hay que subirlo a mano; false = falló al publicar y se puede reintentar. */
  asistido: boolean;
}

export interface AjustesDeAvisos {
  email_notifications_enabled?: boolean;
  recipient_email?: string;
}

const MAX_LISTADOS = 10;
const MAX_MOTIVO = 300;
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** A quién se avisa: el email de avisos de la banda y, si no hay, el de acceso. null = no avisar. */
export function destinatarioDeAvisoPublicacion(p: { ajustes: AjustesDeAvisos | null | undefined; emailBanda?: string }): string | null {
  if (p.ajustes?.email_notifications_enabled === false) return null;
  for (const candidato of [p.ajustes?.recipient_email, p.emailBanda]) {
    if (esEmailValido(candidato)) return String(candidato).trim().toLowerCase();
  }
  return null;
}

const limpiarLinea = (t: string) => t.replace(/[<>\r\n]/g, " ").replace(/\s+/g, " ").trim();

function cuando(p: PostFallido): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(p.fecha || "");
  const dia = m ? `${Number(m[3])} ${MESES[Number(m[2]) - 1] ?? ""}`.trim() : "";
  return [dia, p.hora ? `a las ${p.hora}` : ""].filter(Boolean).join(" ");
}

function renderFallo(p: PostFallido): string {
  const motivo = escapeHtml(p.motivo.length > MAX_MOTIVO ? `${p.motivo.slice(0, MAX_MOTIVO)}…` : p.motivo);
  const que = p.asistido ? "Súbelo tú desde la app y márcalo como publicado." : "Puedes reintentarlo desde la app.";
  const donde = [escapeHtml(p.plataforma), cuando(p) && escapeHtml(cuando(p))].filter(Boolean).join(" · ");
  return `<li style="margin:0 0 10px 0;font-size:14.5px;line-height:1.55;"><strong>${donde}</strong><br>${motivo}<br><span style="color:#646c78;">${que}</span></li>`;
}

export function renderAvisoPublicacionesFallidas(d: { nombreBanda: string; posts: PostFallido[]; appUrl: string }): { subject: string; html: string } {
  const banda = limpiarLinea(d.nombreBanda) || "tu banda";
  const n = d.posts.length;
  const subject = n === 1 ? `Un Reel de ${banda} no se ha publicado` : `${n} Reels de ${banda} no se han publicado`;
  const lista = d.posts.slice(0, MAX_LISTADOS).map(renderFallo).join("");
  const resto = n > MAX_LISTADOS ? parrafo(`…y ${n - MAX_LISTADOS} más.`) : "";
  const cuerpo =
    parrafo(`${n === 1 ? "Un Reel programado" : `${n} Reels programados`} de <strong>${escapeHtml(banda)}</strong> no ${n === 1 ? "ha salido" : "han salido"} a su hora.`) +
    `<ul style="margin:0 0 12px 0;padding-left:20px;">${lista}</ul>` +
    resto +
    parrafo("No se ha perdido nada: el vídeo y el texto siguen guardados en BandManager.");
  return { subject, html: envoltorio(n === 1 ? "Un Reel no se ha publicado" : "Hay Reels que no se han publicado", cuerpo, d.appUrl) };
}
