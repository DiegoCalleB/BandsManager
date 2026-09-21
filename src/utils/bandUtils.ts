// Normaliza un band_id para comparar (quita el prefijo band-/reg-). Antes, un bandId vacío
// devolvía'bakandeya' en silencio: cualquier comprobación tipo `cleanBandId(x) === 'bakandeya'`
// hecha sobre un usuario o registro SIN banda pasaba como si fuese la banda insignia. Usamos un
// centinela que no coincide con ningún band_id real en vez de inventar una banda por defecto.
export function cleanBandId(bandId?: string): string {
 if (!bandId || !bandId.trim()) return '__sin_banda__';
 return bandId.replace(/^(band|reg)-/, '');
}

export function isSameBandId(id1?: string, id2?: string): boolean {
 if (!id1 && !id2) return true;
 if (!id1 || !id2) return false;
 if (id1 === id2) return true;
 return cleanBandId(id1) === cleanBandId(id2);
}
