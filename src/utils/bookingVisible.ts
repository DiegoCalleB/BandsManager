/**
 * El booking (salas, medios, management y grupos aliados: todo lo que sale de los leads) es
 * reservado: solo lo ven las bandas con `suscripcion_habilitada` (y el admin de la plataforma).
 * Para las demás el módulo no existe: no se enseña bloqueado, no se enseña.
 */
export const MODULOS_BOOKING: readonly string[] = ['booking', 'medios', 'management', 'bandas'];

/** `true` si el módulo es de booking y esta banda no tiene acceso a él. */
export function moduloDeBookingOculto(moduloId: string, bookingVisible: boolean): boolean {
  return !bookingVisible && MODULOS_BOOKING.includes(moduloId);
}
