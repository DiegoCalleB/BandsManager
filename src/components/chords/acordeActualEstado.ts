import { useState } from 'react';

const CLAVE_DIAGRAMAS = 'bm_acorde_actual_diagramas';

export interface EstadoAcordeActual {
  /** El que suena o, en pausa, el último que sonó. */
  acorde: string | null;
  /** El que sonó antes (para recomendar la inversión que menos mueve la mano). */
  previo: string | null;
  diagramas: boolean;
  alternarDiagramas: () => void;
}

/**
 * Estado compartido de la barra y de los diagramas del acorde actual (viven en sitios distintos del Atril).
 * Al pausar conserva el último acorde para mirarlo con calma. Los diagramas arrancan abiertos.
 */
export function useAcordeActual(sonando: string | null): EstadoAcordeActual {
  const [ultimo, setUltimo] = useState<string | null>(sonando);
  const [previo, setPrevio] = useState<string | null>(null);
  // Recuerda el último acorde que sonó: se ajusta durante el render, sin efecto.
  if (sonando && sonando !== ultimo) { setPrevio(ultimo); setUltimo(sonando); }
  const [diagramas, setDiagramas] = useState<boolean>(() => {
    try { return localStorage.getItem(CLAVE_DIAGRAMAS) !== '0'; } catch { return true; }
  });
  const alternarDiagramas = () => {
    const v = !diagramas;
    setDiagramas(v);
    try { localStorage.setItem(CLAVE_DIAGRAMAS, v ? '1' : '0'); } catch { /* vale solo esta sesión */ }
  };
  return { acorde: sonando ?? ultimo, previo, diagramas, alternarDiagramas };
}

/** Los tres que vienen después del actual (el primero es «Siguiente»). */
export const proximosVisibles = (acorde: string | null, proximos?: string[], siguiente?: string | null): string[] =>
  (proximos ?? (siguiente ? [siguiente] : [])).filter((c) => c !== acorde).slice(0, 3);
