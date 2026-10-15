// Lo que el servidor ya guardó de un cartel, reflejado en la copia en memoria de los bolos.
// La app carga los bolos una sola vez (`/api/state`): sin esto, al salir de Cartelería y volver
// se «olvidaban» el fondo, la cabeza de cartel y los fondos de IA ya pagados hasta recargar.

export interface CartelGuardado {
  cartel_config?: unknown;
  cartel_url?: string;
}

/** Devuelve la lista con el cartel del bolo `id` actualizado. Los demás bolos conservan su referencia. */
export function conCartelGuardado<T extends { id: string }>(bolos: T[], id: string, cartel: CartelGuardado): T[] {
  if (!bolos.some((b) => b.id === id)) return bolos;
  return bolos.map((b) => (b.id === id ? { ...b, ...cartel } : b));
}
