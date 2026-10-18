/** Consulta a Google Places (New) del estado de una sala. Es el adaptador real de `ConsultaMaps`. */
import type { LugarDeMaps } from '../utils/estadoNegocio.js';
import type { ConsultaMaps } from './verificarSalasEnMaps.js';

const CAMPOS = 'id,displayName,businessStatus';
const TIMEOUT_MS = 8000;

type LugarPlaces = { id?: string; displayName?: { text?: string }; businessStatus?: string };

const aLugar = (l: LugarPlaces | undefined): LugarDeMaps | null => (l?.id ? { id: l.id, nombre: l.displayName?.text ?? '', businessStatus: l.businessStatus } : null);

export function crearConsultaMaps(apiKey: string): ConsultaMaps {
  const cabeceras = { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': CAMPOS };
  return async (sala) => {
    if (sala.place_id) {
      // Con el id de la ficha se consulta esa ficha exacta, sin buscar.
      const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(sala.place_id)}?languageCode=es`, { headers: cabeceras, signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(`Places respondió ${r.status}`);
      return aLugar((await r.json()) as LugarPlaces);
    }
    const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: { ...cabeceras, 'Content-Type': 'application/json', 'X-Goog-FieldMask': `places.${CAMPOS.split(',').join(',places.')}` },
      body: JSON.stringify({ textQuery: `${sala.nombre} ${sala.ciudad ?? ''} España`.trim(), languageCode: 'es', pageSize: 1 }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!r.ok) throw new Error(`Places respondió ${r.status}`);
    return aLugar(((await r.json()) as { places?: LugarPlaces[] }).places?.[0]);
  };
}
