// Soporte de datos para los avisos de choque de calendario: quién pertenece a cada banda y
// qué avisos ya se mandaron (`calendar_conflict_notifications`).

import { getSupabase, cleanBandId } from "./core.js";
import { dbGetUsers, dbGetUserBands } from "./users.js";

interface FilaUsuario {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
}

interface FilaVinculo {
  user_id: string;
  band_id: string;
  role?: string;
}

export interface MiembroBanda {
  id: string;
  nombre: string;
  email: string;
  esLider: boolean;
}

// Respaldo en proceso: si la tabla aún no existe (migración sin aplicar) o Supabase falla, no
// reenviamos el mismo aviso mientras el proceso siga vivo. No sobrevive a un redeploy; la fuente
// de verdad real es la tabla.
const avisadosEnMemoria = new Set<string>();
const clave = (userId: string, huella: string) => `${userId}|${huella}`;

/**
 * Miembros de una banda: los que la tienen como banda principal (`users.band_id`), el dueño
 * registrado y los que se unieron vía `user_bands` (un músico en varias bandas solo aparece
 * en la principal con `dbGetUsers`).
 */
export async function dbGetMiembrosBanda(bandId: string): Promise<MiembroBanda[]> {
  const cleanId = cleanBandId(bandId);
  const porId = new Map<string, MiembroBanda>();

  const directos: FilaUsuario[] = await dbGetUsers(cleanId);
  for (const u of directos) {
    if (!u?.id) continue;
    porId.set(u.id, {
      id: u.id,
      nombre: u.name || u.username || "Integrante",
      email: (u.email || "").trim().toLowerCase(),
      esLider: u.role === "leader",
    });
  }

  const vinculos: FilaVinculo[] = await dbGetUserBands(undefined, cleanId);
  const faltan = vinculos.filter((v) => v.user_id && !porId.has(v.user_id));
  if (faltan.length > 0) {
    const sb = getSupabase();
    const { data } = await sb
      .from("users")
      .select("id, name, username, email")
      .in("id", faltan.map((v) => v.user_id));
    const rolPorUsuario = new Map<string, string | undefined>(faltan.map((v) => [v.user_id, v.role]));
    for (const u of (data || []) as Array<FilaUsuario & { id: string }>) {
      porId.set(u.id, {
        id: u.id,
        nombre: u.name || u.username || "Integrante",
        email: (u.email || "").trim().toLowerCase(),
        esLider: rolPorUsuario.get(u.id) === "leader",
      });
    }
  }
  // Un vínculo explícito de líder también cuenta para quien ya estaba como miembro directo
  for (const v of vinculos) {
    const m = porId.get(v.user_id);
    if (m && v.role === "leader") m.esLider = true;
  }

  return [...porId.values()];
}

/** Bandas (ids limpios) a las que pertenece un usuario, además de la principal. */
export async function dbGetBandasDeUsuario(userId: string): Promise<string[]> {
  const vinculos: FilaVinculo[] = await dbGetUserBands(userId);
  return [...new Set(vinculos.map((v) => cleanBandId(v.band_id)).filter(Boolean))];
}

/** Devuelve las claves `userId|huella` que ya se avisaron. */
export async function dbYaAvisados(userIds: string[], huellas: string[]): Promise<Set<string>> {
  const out = new Set<string>();
  for (const u of userIds) for (const h of huellas) if (avisadosEnMemoria.has(clave(u, h))) out.add(clave(u, h));
  if (userIds.length === 0 || huellas.length === 0) return out;

  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("calendar_conflict_notifications")
      .select("user_id, huella")
      .in("user_id", userIds)
      .in("huella", huellas);
    if (!error) for (const r of data || []) out.add(clave(r.user_id, r.huella));
  } catch (e) {
    console.warn("[CalendarConflicts] No se pudo leer calendar_conflict_notifications:", e);
  }
  return out;
}

export async function dbMarcarAvisados(bandId: string, pares: Array<{ userId: string; huella: string }>): Promise<void> {
  if (pares.length === 0) return;
  for (const p of pares) avisadosEnMemoria.add(clave(p.userId, p.huella));

  try {
    const sb = getSupabase();
    const band = cleanBandId(bandId);
    const { error } = await sb
      .from("calendar_conflict_notifications")
      .upsert(
        pares.map((p) => ({ band_id: band, user_id: p.userId, huella: p.huella })),
        { onConflict: "user_id,huella", ignoreDuplicates: true },
      );
    if (error) console.warn("[CalendarConflicts] No se pudo guardar el aviso:", error.message);
  } catch (e) {
    console.warn("[CalendarConflicts] No se pudo guardar el aviso:", e);
  }
}
