import { useCallback, useEffect, useState } from 'react';

export interface DisenoMerchan {
  id: string;
  type: string;
  url: string;
  processedUrl?: string;
  bg: string;
  text: string;
  assetType: string;
  shirtColor?: string;
  qrUrl?: string;
  date: string;
}

const claveGaleria = (cleanBand: string) => `merchan_designs_${cleanBand || 'default'}`;

function leerGaleria(clave: string): DisenoMerchan[] {
  try {
    const saved = localStorage.getItem(clave);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Galería de diseños de merchandising cacheada por banda en localStorage. El estado va
 * etiquetado con la clave de la banda que lo cargó: al cambiar de banda se recarga durante
 * el render y nunca se escribe la galería de una banda bajo la clave de otra.
 */
export function useDisenosMerchan(cleanBand: string) {
  const clave = claveGaleria(cleanBand);
  const [galeria, setGaleria] = useState(() => ({ clave, lista: leerGaleria(clave) }));
  if (galeria.clave !== clave) setGaleria({ clave, lista: leerGaleria(clave) });

  useEffect(() => {
    try {
      localStorage.setItem(galeria.clave, JSON.stringify(galeria.lista));
    } catch {
      /* cuota llena o almacenamiento bloqueado: la galería sigue viva en memoria */
    }
  }, [galeria]);

  const setDisenos = useCallback(
    (siguiente: DisenoMerchan[] | ((prev: DisenoMerchan[]) => DisenoMerchan[])) =>
      setGaleria((g) => ({
        clave: g.clave,
        lista: typeof siguiente === 'function' ? siguiente(g.lista) : siguiente,
      })),
    [],
  );

  return [galeria.lista, setDisenos] as const;
}
