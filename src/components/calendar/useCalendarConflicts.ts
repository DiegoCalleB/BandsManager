import { useEffect, useMemo, useState } from 'react';
import type { Concert, Rehearsal } from '../../types';
import { apiFetch } from '../../utils/api';
import { construirEventos, detectarChoques, type Choque } from '../../utils/calendarConflicts';

function hoyLocalISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Choques del calendario, en dos capas que usan el MISMO detector que el email:
 *  1. Local e instantánea: lo que ya está cargado en pantalla (misma banda). Sin red.
 *  2. Servidor: los que cruzan bandas (un músico en dos grupos), que el navegador no puede
 *     calcular porque no conoce los miembros de las otras bandas. Llega ya redactado.
 * Si el servidor falla o no hay Supabase, la capa local sigue funcionando.
 */
export function useCalendarConflicts(params: {
  concerts: Concert[];
  rehearsals: Rehearsal[];
  bandId: string;
}): Choque[] {
  const { concerts, rehearsals, bandId } = params;

  const locales = useMemo(
    () => detectarChoques(construirEventos(concerts, rehearsals, bandId), { desde: hoyLocalISO() }),
    [concerts, rehearsals, bandId],
  );

  // Firma barata de lo que importa para un choque: cambia al crear, mover o borrar un evento.
  const firma = useMemo(
    () =>
      [
        ...concerts.map((c) => `c${c.id}${c.fecha}${c.is_posible ? 'p' : ''}${c.convocados_ids?.join(',') ?? ''}`),
        ...rehearsals.map((r) => `r${r.id}${r.fecha}${r.hora}${r.horaFin ?? ''}${r.estado}${r.convocados_ids?.join(',') ?? ''}`),
      ].join('|'),
    [concerts, rehearsals],
  );

  const [cruzados, setCruzados] = useState<Choque[]>([]);

  useEffect(() => {
    if (!bandId) return;
    let cancelado = false;
    // Espera a que el usuario termine de editar; el servidor hace varias consultas por llamada.
    const t = setTimeout(async () => {
      try {
        const data = await apiFetch<{ conflicts?: Choque[] }>('/api/calendar/conflicts');
        if (!cancelado) setCruzados((data.conflicts ?? []).filter((c) => c.entreBandas));
      } catch {
        if (!cancelado) setCruzados([]);
      }
    }, 1500);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [firma, bandId]);

  return useMemo(() => {
    const vistos = new Set(locales.map((c) => c.huella));
    return [...locales, ...cruzados.filter((c) => !vistos.has(c.huella))].sort(
      (x, y) =>
        x.fecha.localeCompare(y.fecha) || (x.severidad === y.severidad ? 0 : x.severidad === 'choque' ? -1 : 1),
    );
  }, [locales, cruzados]);
}
