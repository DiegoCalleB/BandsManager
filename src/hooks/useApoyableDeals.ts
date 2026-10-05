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
export function useApoyableDeals(enabled: boolean, bandId?: string) {
  const [deals, setDeals] = useState<ApoyableDeal[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled || !bandId) return;
    try {
      const data = await apiFetch<{ deals?: ApoyableDeal[] }>('/api/donations/deal-support');
      setDeals(Array.isArray(data?.deals) ? data.deals : []);
    } catch {
      setDeals([]);
    } finally {
      setLoaded(true);
    }
  }, [enabled, bandId]);

  useEffect(() => {
    setDeals([]);
    setLoaded(false);
    refresh();
    // 'app-data-updated' se emite cuando llegan datos nuevos (p. ej. la sala acaba de firmar).
    window.addEventListener('app-data-updated', refresh);
    return () => window.removeEventListener('app-data-updated', refresh);
  }, [refresh]);

  return { deals, loaded, refresh };
}
