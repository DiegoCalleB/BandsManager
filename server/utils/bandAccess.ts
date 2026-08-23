import type express from "express";
import { isValidEmail } from "./email.js";

/**
 * Resuelve sobre qué banda opera una petición, respetando a qué bandas pertenece el usuario.
 *
 * `getUserFromRequest` (server/auth.ts) ya calcula `allowedBandIds` y ya valida la cabecera
 * `x-band-id` antes de fijar `user.band_id`. El agujero que cierra este helper es el de las
 * rutas que se saltaban ese valor ya validado y leían `req.body.bandId` o la cabecera a pelo:
 * ahí cualquiera podía operar sobre la banda de otro con solo cambiar una cabecera.
 *
 * La regla: se acepta la banda pedida SOLO si el usuario pertenece a ella (o es admin de la
 * plataforma). Si no, se cae a la banda del propio usuario en vez de fallar, que es como se
 * comportaba ya el repertorio y evita romper a quien manda una cabecera obsoleta.
 *
 * Extraído de server/routes/repertorio.ts, que ya lo hacía bien, para no tener dos criterios.
 */
export function getTargetBandId(req: express.Request): string {
  const user = (req as any).user;
  const userBandId = user?.band_id;
  const headerBandId = (
    req.headers["x-band-id"] ||
    req.headers["x-active-band-id"] ||
    req.query.band_id ||
    req.query.bandId ||
    (req.body as any)?.bandId ||
    (req.body as any)?.band_id
  ) as string | undefined;

  if (headerBandId && typeof headerBandId === "string" && headerBandId.trim() && user) {
    const cleanHeader = headerBandId.trim();
    const cleanNoPrefix = cleanHeader.replace(/^(band|reg)-/, "");
    const allowed = Array.isArray(user.allowedBandIds) ? user.allowedBandIds : [];
    const isAllowed =
      user.role === "admin" ||
      allowed.some((b: string) => b === cleanHeader || b.replace(/^(band|reg)-/, "") === cleanNoPrefix);
    if (isAllowed) return cleanHeader;
  }

  return userBandId || "band-bakandeya";
}

/**
 * La banda que la petición pide EXPLÍCITAMENTE, sin validar. Sirve para distinguir "no me han
 * pedido ninguna" de "me han pedido una que no es suya": en una lectura degradar a la banda
 * propia está bien, pero en una ESCRITURA hay que fallar de cara. Si no, mandar el bandId de
 * otra banda por error acabaría escribiendo ese contenido en la tuya, en silencio.
 */
export function bandaSolicitada(req: express.Request): string | undefined {
  const bruto = (
    req.headers["x-band-id"] ||
    req.headers["x-active-band-id"] ||
    req.query.band_id ||
    req.query.bandId ||
    (req.body as any)?.bandId ||
    (req.body as any)?.band_id
  ) as string | undefined;
  const limpio = typeof bruto === "string" ? bruto.trim() : "";
  return limpio || undefined;
}

/** ¿Puede este usuario escribir en la banda indicada? Para rutas que deben fallar, no degradar. */
export function puedeEscribirEnBanda(req: express.Request, bandId: string): boolean {
  const user = (req as any).user;
  if (!user) return false;
  if (user.role === "admin") return true;
  const limpio = (bandId || "").replace(/^(band|reg)-/, "");
  const allowed = Array.isArray(user.allowedBandIds) ? user.allowedBandIds : [];
  return allowed.some((b: string) => b === bandId || b.replace(/^(band|reg)-/, "") === limpio);
}

/** ¿Apuntan las dos cadenas a la misma banda, con o sin el prefijo band-/reg-? */
export function mismaBanda(a?: string, b?: string): boolean {
  const limpiar = (v?: string) => (v || "").trim().replace(/^(band|reg)-/, "").toLowerCase();
  const la = limpiar(a);
  return Boolean(la) && la === limpiar(b);
}

/**
 * Banda y email sobre los que opera una petición sensible (facturación, suscripciones), o null
 * si pide una banda ajena.
 *
 * La diferencia con `getTargetBandId` es que aquí NO se degrada a la banda propia: si la petición
 * nombra una banda que no es suya, la ruta debe responder 403. En facturación, "he pedido la
 * banda de otro" nunca es un despiste que se pueda corregir por dentro sin avisar.
 *
 * El email tampoco puede venir del cliente. La búsqueda de banda en facturación cae también por
 * email, así que mandar el de otra persona bastaba para acabar operando sobre SU suscripción.
 */
export function bandaFacturableDelUsuario(req: express.Request): { bandId: string; email?: string } | null {
  const user = (req as any).user;
  if (!user) return null;

  const pedida = bandaSolicitada(req);
  if (pedida && !puedeEscribirEnBanda(req, pedida)) return null;

  const bandId = pedida || user.band_id;
  if (!bandId) return null;

  const email = [user.email, user.username].find((v: unknown): v is string =>
    typeof v === "string" && isValidEmail(v)
  );
  return { bandId, email };
}
