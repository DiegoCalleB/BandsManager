/**
 * Nombre visible de una banda en las páginas públicas. Misma regla que el EPK público
 * (`/public/epk`): el nombre registrado salvo que sea el genérico «banda»; si no, el nombre de
 * contacto de booking del EPK; y como último recurso, el id de la banda legible.
 */

const GENERICOS = new Set(['banda', 'band', '']);

export function humanizarBandId(bandId: string): string {
  return bandId
    .replace(/^(band|reg)-/i, '')
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function elegirNombreBanda(
  fila: { nombre_banda?: unknown } | null | undefined,
  epkConfig: { contactoBooking?: { nombre?: unknown } } | null | undefined,
  bandId: string
): string {
  const registrado = typeof fila?.nombre_banda === 'string' ? fila.nombre_banda.trim() : '';
  if (registrado && !GENERICOS.has(registrado.toLowerCase())) return registrado;

  const contacto = typeof epkConfig?.contactoBooking?.nombre === 'string' ? epkConfig.contactoBooking.nombre.trim() : '';
  const limpio = bandId.replace(/^(band|reg)-/i, '').toLowerCase();
  // El nombre de contacto por defecto repite el id de la banda («mi-banda»): no es un nombre.
  if (contacto && !GENERICOS.has(contacto.toLowerCase()) && !contacto.toLowerCase().includes(limpio)) return contacto;

  return humanizarBandId(bandId) || 'Banda';
}
