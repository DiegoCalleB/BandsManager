/**
 * Cuándo toca publicar un post programado.
 *
 * `fecha` + `hora_programada` son la hora de pared que eligió la banda en SU zona horaria. Antes
 * se comparaban con la hora del servidor (UTC en Railway): un Reel a las 20:30 de Madrid salía a
 * las 22:30. Aquí se convierten a un instante absoluto con la zona de la banda, cambio de hora
 * incluido, sin dependencias: `Intl` ya trae la base de datos de zonas.
 */
import type { SocialPost } from "../../src/types.js";

const ZONA_POR_DEFECTO = "Europe/Madrid";
/** Más que esto en 'publicando' = el proceso murió a mitad (Instagram tarda segundos, no cuartos de hora). */
export const MINUTOS_MAX_PUBLICANDO = 15;

function zonaValida(zona: string | undefined): string {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zona || ZONA_POR_DEFECTO });
    return zona || ZONA_POR_DEFECTO;
  } catch {
    return ZONA_POR_DEFECTO;
  }
}

/** Desfase (ms) de la zona respecto a UTC en un instante dado. */
function desfaseMs(instante: number, zona: string): number {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: zona,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })
      .formatToParts(new Date(instante))
      .map((p) => [p.type, p.value])
  );
  const comoUtc = Date.UTC(+partes.year, +partes.month - 1, +partes.day, +partes.hour, +partes.minute, +partes.second);
  return comoUtc - instante;
}

/** Instante absoluto de `fecha` (YYYY-MM-DD) a `hora` (HH:MM) en la zona de la banda. */
export function instanteProgramado(fecha: string, hora: string | undefined, zona?: string): Date {
  const z = zonaValida(zona);
  const [y, m, d] = fecha.split("-").map(Number);
  const [hh, mm] = (hora || "00:00").split(":").map(Number);
  const pared = Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0);
  // Dos pasadas: la primera estimación puede caer al otro lado de un cambio de hora.
  const estimado = pared - desfaseMs(pared, z);
  return new Date(pared - desfaseMs(estimado, z));
}

/**
 * Posts que ya deben salir. Solo los que un humano aprobó ('aprobado' o 'en_cola'): un borrador
 * con `auto_publish` ya no se publica solo — publicar en nombre de la banda es tan público como
 * un email comercial y necesita la misma aprobación explícita (AGENTS.md §3).
 */
export function postsVencidos(posts: SocialPost[], zona: string | undefined, ahora: Date): SocialPost[] {
  return posts.filter((p) => {
    if (p.estado !== "aprobado" && p.estado !== "en_cola") return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.fecha || "")) return false;
    return instanteProgramado(p.fecha, p.hora_programada, zona).getTime() <= ahora.getTime();
  });
}

export function estaColgadoPublicando(post: SocialPost, ahora: Date): boolean {
  if (post.estado !== "publicando") return false;
  const inicio = post.publish_started_at ? Date.parse(post.publish_started_at) : NaN;
  if (Number.isNaN(inicio)) return true;
  return ahora.getTime() - inicio > MINUTOS_MAX_PUBLICANDO * 60_000;
}
