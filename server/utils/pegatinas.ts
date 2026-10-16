// Regalo de pegatinas en la primera suscripción de pago. Puro (sin red ni BD) para poder probarlo.
// Las cantidades son las que enseñan la pantalla Planes y la landing TFM: un test las mantiene juntas.

export const PEGATINAS_POR_PLAN: Readonly<Record<string, { cantidad: number; expres: boolean }>> = {
  local: { cantidad: 50, expres: false },
  de_gira: { cantidad: 100, expres: false },
  cabeza_de_cartel: { cantidad: 200, expres: true },
};

interface BandaConPlan {
  band_id?: string;
  plan?: string;
  estado_suscripcion?: string;
}

const sinPrefijo = (id: string) => id.replace(/^(band|reg)-/i, '').toLowerCase().trim();

/**
 * Banda con derecho al pack, con su `band_id` real y su plan, o null. Exige plan de pago Y suscripción
 * activa: un plan puesto a mano sin cobro no regala nada. Coincidencia exacta de `band_id`, sin nombres
 * parecidos.
 */
export function bandaConPack(bandas: ReadonlyArray<BandaConPlan> | undefined, bandId: string | undefined) {
  const buscada = sinPrefijo(bandId || '');
  if (!buscada || buscada === 'default') return null;
  const banda = (bandas || []).find((b) => sinPrefijo(b.band_id || '') === buscada);
  if (!banda?.band_id || banda.estado_suscripcion !== 'activo') return null;
  const plan = (banda.plan || '').toLowerCase();
  const pack = PEGATINAS_POR_PLAN[plan];
  return pack ? { bandId: banda.band_id, plan, ...pack } : null;
}

/** Solo el pack (cantidad y envío exprés) al que tiene derecho la banda, o null. */
export function packDeLaBanda(bandas: ReadonlyArray<BandaConPlan> | undefined, bandId: string | undefined) {
  const b = bandaConPack(bandas, bandId);
  return b ? { cantidad: b.cantidad, expres: b.expres } : null;
}

export interface EnvioPegatinas {
  nombre: string;
  direccion: string;
  cp: string;
  ciudad: string;
  pais: string;
  telefono: string;
}

const limpiar = (valor: unknown, max: number) =>
  typeof valor === 'string' ? valor.replace(/\s+/g, ' ').trim().slice(0, max) : '';

/** Devuelve el envío limpio o el error que se le enseña a quien lo pide. */
export function validarEnvioPegatinas(body: unknown): { ok: true; envio: EnvioPegatinas } | { ok: false; error: string } {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const envio: EnvioPegatinas = {
    nombre: limpiar(b.nombre, 120),
    direccion: limpiar(b.direccion, 200),
    cp: limpiar(b.cp, 12),
    ciudad: limpiar(b.ciudad, 80),
    pais: limpiar(b.pais, 60) || 'España',
    telefono: limpiar(b.telefono, 30),
  };
  if (!envio.nombre || !envio.direccion || !envio.cp || !envio.ciudad) {
    return { ok: false, error: 'Rellena nombre, dirección, código postal y ciudad.' };
  }
  if (b.consentimiento !== true) return { ok: false, error: 'Marca la casilla para poder enviarte el pack.' };
  return { ok: true, envio };
}
