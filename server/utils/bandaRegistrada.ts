// Busca el registro de una banda por su id sin confundir ids gemelos (`mi-banda` y `band-mi-banda`).

export interface BandaBuscable {
  band_id?: string;
  id?: string;
  nombre_banda?: string;
  bandName?: string;
  name?: string;
}

const sinPrefijo = (valor?: string) => (valor || "").replace(/^(band|reg)-/, "").toLowerCase().trim();

/**
 * Registro de la banda `bandId`. Primero el id EXACTO: si dos registros comparten el id sin prefijo
 * (`mi-banda` y `band-mi-banda`), buscar solo por el limpio devolvía el primero de la lista y el
 * usuario acababa en la gemela vacía. Si no hay exacto, coincide por id sin prefijo o por nombre.
 */
export function buscarBandaRegistrada<T extends BandaBuscable>(bandas: T[] | undefined, bandId: string): T | undefined {
  const lista = bandas || [];
  const exacta = lista.find((b) => b.band_id === bandId || b.id === bandId);
  if (exacta) return exacta;
  const limpio = sinPrefijo(bandId);
  return lista.find(
    (b) =>
      sinPrefijo(b.band_id) === limpio ||
      sinPrefijo(b.id) === limpio ||
      (limpio.length > 1 && (b.nombre_banda || b.bandName || b.name || "").toLowerCase().trim() === limpio),
  );
}
