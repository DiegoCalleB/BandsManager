// Tipos compartidos del asesor que no pertenecen a un solo módulo: lo que la banda hace con una idea.
// Viven aparte para que `opciones` (que ordena las ideas) y `resumen` (que aprende de los resultados)
// no se necesiten mutuamente.
import type { Formato } from './reglasFormato';

export type Accion = 'hecho' | 'saltado';

export interface AccionRegistrada {
  /** AAAA-MM-DD. */
  fecha: string;
  tarjetaId: string;
  formato: Formato;
  accion: Accion;
  /** El título de la idea cuando se marcó. Vacío en las acciones anteriores a guardarlo. */
  titulo?: string;
}
