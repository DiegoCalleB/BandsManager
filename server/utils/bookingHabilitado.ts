// El booking (salas, medios, management, grupos aliados, agentes y campañas) es reservado: solo
// las bandas con `registered_bands.suscripcion_habilitada` (y el admin de la plataforma) lo usan.
// El resto no lo ve en la app ni puede llamar a su API. El código no conoce qué bandas son
// (ADR 0027): se enciende con un UPDATE en la base de datos.
import type { NextFunction, Request, Response } from 'express';
import { getUserFromRequest } from '../auth.js';
import { loadState } from '../state.js';
import { suscripcionHabilitada } from './suscripcion.js';

/** Rutas de /api que son booking (la ruta es relativa a /api). Los alias `/:id/enrich-*` siguen ahí. */
const RUTAS_BOOKING =
  /^\/(leads|places-search|campaign-mass-search|extract-emails|import-places|multi-source-venues|similar-artists-venues|public-cultural-radar|import-excel|detect-all-dates|batch-enrich-campaign|example-threads|validate-emails|scrape-contact|generate-simulated-email|templates|trigger-agent|agent-runs|agent-logs|agents|agent-queue|campaigns)(\/|$)|^\/[^/]+\/(enrich|detect|verify|calculate)-[a-z-]+$/;

export const BOOKING_NO_HABILITADO = {
  success: false,
  code: 'booking_no_habilitado',
  error: 'Esta función no está disponible para tu banda.',
} as const;

/** `true` si la fila de `registered_bands` tiene el booking encendido (los procesos de fondo no tienen sesión). */
export function bandaConBooking(banda: object | null | undefined): boolean {
  return (banda as { suscripcion_habilitada?: unknown } | null | undefined)?.suscripcion_habilitada === true;
}

/** `true` si esta persona, con la banda que tiene activa, puede usar el booking. */
export function puedeVerBooking(user: { role?: string; band_id?: string } | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return suscripcionHabilitada(loadState().registeredBands, user.band_id);
}

/**
 * Corta las rutas de booking a las bandas sin acceso. Sin sesión no decide nada: la propia ruta
 * responde 401 (o deja pasar al cron con su secreto, que no lleva usuario).
 */
export function guardiaBooking(req: Request, res: Response, next: NextFunction) {
  if (!RUTAS_BOOKING.test(req.path)) return next();
  const user = getUserFromRequest(req, loadState);
  if (!user || puedeVerBooking(user)) return next();
  return res.status(403).json(BOOKING_NO_HABILITADO);
}

/** El estado de la banda sin nada de booking (copia: no toca la caché compartida). */
export function sinBooking<T extends { leads?: unknown; messages?: unknown; campaigns?: unknown }>(estado: T): T {
  return { ...estado, leads: [], messages: [], campaigns: [] };
}
