/**
 * Cuánto fiarse de la fecha guardada de un festival. Se deduce solo de las fechas (sin migración):
 * - `proxima`: la fecha aún no ha pasado → es la de la edición que viene; se muestra con su año.
 * - `estimada`: la fecha ya pasó → es la de la última edición conocida; sirve de orientación y hay que revisarla.
 * El agente nocturno la sustituye por la nueva cuando el festival publica la siguiente (`reverificarEmail.ts`).
 */

export type NivelFechaFestival = 'sin_fecha' | 'proxima' | 'estimada';

export interface FiabilidadFecha {
  nivel: NivelFechaFestival;
  edicion?: number;
  motivo: string;
}

interface FechasDeFestival {
  festival_start_date?: string | null;
  festival_end_date?: string | null;
}

export function fiabilidadFechaFestival(lead: FechasDeFestival, ahora: Date = new Date()): FiabilidadFecha {
  const inicio = (lead.festival_start_date ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio)) return { nivel: 'sin_fecha', motivo: 'Sin fecha.' };
  const fin = (lead.festival_end_date ?? '').slice(0, 10) || inicio;
  const edicion = Number(inicio.slice(0, 4));
  const hoy = ahora.toISOString().slice(0, 10);
  return fin < hoy
    ? { nivel: 'estimada', edicion, motivo: `Fecha de la edición ${edicion}: orientativa, puede cambiar. Revísala antes de proponer.` }
    : { nivel: 'proxima', edicion, motivo: `Fecha publicada para la edición ${edicion}.` };
}
