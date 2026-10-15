import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

export interface ApoyableDeal {
  deal_id: string;
  lugar_sala: string;
  ciudad: string;
  fecha_evento: string;
  total_acordado: number;
  suggested_cents: number;
}

/**
 * Bolos firmados por la sala y recientes que aún no tienen aportación voluntaria a BandManager.
 * El importe sugerido lo calcula el servidor; aquí solo se pinta. Es una función opcional: ante
 * cualquier fallo la lista queda vacía y no se muestra nada.
 */
/**
 * Acuerdos de concierto que se pueden apoyar con una aportación, con el importe sugerido en
 * céntimos.
 */
export function useApoyableDeals(enabled: boolean, bandId?: string) {
  const [deals, setDeals] = useState<ApoyableDeal[]>([]);
  const [loaded, setLoaded] = useState(false);
  // Al cambiar de banda (o activarse) se vacía lo anterior en el propio render, no en un efecto.
  const contexto = `${enabled}|${bandId ?? ''}`;
  const [contextoPrevio, setContextoPrevio] = useState(contexto);
  if (contexto !== contextoPrevio) {
    setContextoPrevio(contexto);
    setDeals([]);
    setLoaded(false);
  }

  const refresh = useCallback(async () => {
    if (!enabled || !bandId) return;
    setDeals(await pedirDealsApoyables());
    setLoaded(true);
  }, [enabled, bandId]);

  useEffect(() => {
    if (!enabled || !bandId) return;
    let vivo = true;
    const cargar = () => {
      pedirDealsApoyables().then((lista) => {
        if (!vivo) return;
        setDeals(lista);
        setLoaded(true);
      });
    };
    cargar();
    // 'app-data-updated' se emite cuando llegan datos nuevos (p. ej. la sala acaba de firmar).
    window.addEventListener('app-data-updated', cargar);
    return () => {
      vivo = false;
      window.removeEventListener('app-data-updated', cargar);
    };
  }, [enabled, bandId]);

  return { deals, loaded, refresh };
}

/** Deals que admiten apoyo de fans; lista vacía si falla la petición. */
async function pedirDealsApoyables(): Promise<ApoyableDeal[]> {
  try {
    const data = await apiFetch<{ deals?: ApoyableDeal[] }>('/api/donations/deal-support');
    return Array.isArray(data?.deals) ? data.deals : [];
  } catch {
    return [];
  }
}
