/**
 * Progreso de una escucha de Chordscribe (acordes o letra): tipos, sondeo al servidor y el
 * porcentaje que se pinta. Separado de ModalOido.tsx para que el modal exporte solo componentes.
 */
import { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';

export interface EtapaOido { id: string; titulo: string }
export interface ProgresoOido {
  tarea: 'acordes' | 'letra';
  etapas: EtapaOido[];
  actual: string | null;
  detalle: string;
  pct: number;
  estado: 'en_curso' | 'listo' | 'error';
  error?: string;
  inicio: number;
}

/** Progreso más el instante (ms) en que empezó la etapa actual, para el avance suave. */
export interface SondeoOido {
  progreso: ProgresoOido | null;
  inicioEtapa: number;
}

/**
 * Consulta el progreso mientras `activo`; el servidor lo anota, la petición larga sigue su curso.
 * Al desactivarse se olvida el progreso, para no enseñar el de la escucha anterior al reabrir.
 */
export function useProgresoOido(songId: string, activo: boolean): SondeoOido {
  const [sondeo, setSondeo] = useState<SondeoOido>({ progreso: null, inicioEtapa: 0 });
  useEffect(() => {
    if (!activo) return;
    let vivo = true;
    const consultar = async () => {
      try {
        const r = await apiFetch<{ progreso: ProgresoOido | null }>(`/api/songs/${encodeURIComponent(songId)}/progreso-oido`);
        const nuevo = r?.progreso;
        if (!vivo || !nuevo) return;
        setSondeo((prev) => ({
          progreso: nuevo,
          inicioEtapa: prev.progreso?.actual === nuevo.actual && prev.inicioEtapa ? prev.inicioEtapa : Date.now(),
        }));
      } catch { /* la siguiente consulta lo recupera */ }
    };
    consultar();
    const t = setInterval(consultar, 800);
    return () => {
      vivo = false;
      clearInterval(t);
      setSondeo({ progreso: null, inicioEtapa: 0 });
    };
  }, [songId, activo]);
  return sondeo;
}

/** Porcentaje que se ve: el del servidor (inicio de etapa) más un avance suave dentro de la etapa, sin llegar a la siguiente. */
export function pctVisible(p: ProgresoOido, msEnEtapa: number): number {
  if (p.estado === 'listo') return 100;
  const paso = 100 / p.etapas.length;
  const extra = paso * 0.9 * (1 - Math.exp(-msEnEtapa / 9000));
  return Math.min(99, Math.round(p.pct + extra));
}
