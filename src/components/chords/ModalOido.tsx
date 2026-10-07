import React, { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Ear, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { Button } from '../ui';

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

/** Qué significa cada etapa, en una frase de músico (no de ingeniero). */
const PORQUE: Record<string, string> = {
  voz: 'Si ya separaste las voces con Iris, escucha solo la voz: así sale una letra mucho más limpia.',
  audio: 'Coge el mejor audio disponible (instrumental, stems o mezcla) y lo prepara para escucharlo.',
  acordes: 'Analiza las notas que suenan en cada instante y decide qué acorde es y cuándo cambia.',
  pulso: 'Mide el tempo real y coloca cada cambio de acorde en su compás, como lo sentirías tocando.',
  revision: 'Si el resultado no es fiable (un solo acorde, mucho ruido…), te lo dice en vez de inventárselo.',
  transcribir: 'Reconocimiento de voz con tiempos. Nunca inventa la letra a partir del título.',
  unir: 'Pone cada acorde encima de la palabra donde cambia. Esto es lo que verás en el Atril.',
};

const TITULO: Record<ProgresoOido['tarea'], string> = {
  acordes: 'El Oído está escuchando tu canción',
  letra: 'El Oído está sacando la letra y los acordes',
};

/** Consulta el progreso mientras `activo`; el servidor lo anota, la petición larga sigue su curso. */
export function useProgresoOido(songId: string, activo: boolean): ProgresoOido | null {
  const [progreso, setProgreso] = useState<ProgresoOido | null>(null);
  useEffect(() => {
    if (!activo) { setProgreso(null); return; }
    let vivo = true;
    const consultar = async () => {
      try {
        const r = await apiFetch<{ progreso: ProgresoOido | null }>(`/api/songs/${encodeURIComponent(songId)}/progreso-oido`);
        if (vivo && r?.progreso) setProgreso(r.progreso);
      } catch { /* la siguiente consulta lo recupera */ }
    };
    consultar();
    const t = setInterval(consultar, 800);
    return () => { vivo = false; clearInterval(t); };
  }, [songId, activo]);
  return progreso;
}

const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;

/** Porcentaje que se ve: el del servidor (inicio de etapa) más un avance suave dentro de la etapa, sin llegar a la siguiente. */
export function pctVisible(p: ProgresoOido, msEnEtapa: number): number {
  if (p.estado === 'listo') return 100;
  const paso = 100 / p.etapas.length;
  const extra = paso * 0.9 * (1 - Math.exp(-msEnEtapa / 9000));
  return Math.min(99, Math.round(p.pct + extra));
}

interface Props {
  abierto: boolean;
  tarea: ProgresoOido['tarea'];
  songId: string;
  titulo: string;
  onOcultar: () => void;
}

export const ModalOido: React.FC<Props> = ({ abierto, tarea, songId, titulo, onOcultar }) => {
  const p = useProgresoOido(songId, abierto);
  const [ahora, setAhora] = useState(Date.now());
  const cambio = useRef<{ id: string | null; t: number }>({ id: null, t: Date.now() });
  useEffect(() => {
    if (!abierto) return;
    const t = setInterval(() => setAhora(Date.now()), 500);
    return () => clearInterval(t);
  }, [abierto]);
  if (!abierto) return null;
  if (p && cambio.current.id !== p.actual) cambio.current = { id: p.actual, t: Date.now() };

  const etapas = p?.etapas ?? [];
  const iActual = p ? etapas.findIndex((e) => e.id === p.actual) : -1;
  const pct = p ? pctVisible(p, ahora - cambio.current.t) : 0;
  const falla = p?.estado === 'error';

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-[var(--scrim)]/60 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={TITULO[tarea]}>
      <div translate="no" className="notranslate w-full sm:max-w-md bg-[var(--surface)] text-[var(--ink)] rounded-t-[var(--r-l)] sm:rounded-[var(--r-l)] p-5 space-y-4 shadow-xl">
        <div className="flex items-start gap-3">
          <span className={`shrink-0 w-10 h-10 rounded-[var(--r-pill)] flex items-center justify-center ${falla ? 'bg-[var(--alert-soft)] text-[var(--alert)]' : 'bg-[var(--acc-soft)] text-[var(--acc-ink)]'}`}>
            {falla ? <AlertTriangle className="w-5 h-5" /> : <Ear className="w-5 h-5" />}
          </span>
          <div className="min-w-0">
            <h2 className="font-bold leading-tight">{falla ? 'El Oído no ha podido con esta' : TITULO[tarea]}</h2>
            <p className="text-sm text-[var(--ink-2)] truncate">«{titulo}»</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="h-2 rounded-[var(--r-pill)] bg-[var(--sunken)] overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className={`h-full rounded-[var(--r-pill)] transition-[width] duration-500 ${falla ? 'bg-[var(--alert)]' : 'bg-[var(--acc)]'}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-[var(--ink-2)] tabular-nums">
            <span>{falla ? p?.error : p?.detalle ?? 'Preparando…'}</span>
            <span>{pct}% · {p ? fmt(ahora - p.inicio) : '0:00'}</span>
          </div>
        </div>

        <ol className="space-y-2">
          {etapas.map((e, i) => {
            const hecha = p?.estado === 'listo' || (iActual >= 0 && i < iActual);
            const enCurso = i === iActual && p?.estado === 'en_curso';
            return (
              <li key={e.id} className={`flex items-start gap-2.5 text-sm ${hecha || enCurso ? 'text-[var(--ink)]' : 'text-[var(--ink-2)]'}`}>
                <span className={`mt-0.5 shrink-0 w-5 h-5 rounded-[var(--r-pill)] flex items-center justify-center ${hecha ? 'bg-[var(--ok)] text-[var(--on-ok)]' : enCurso ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)]' : 'bg-[var(--sunken)]'}`}>
                  {hecha ? <Check className="w-3 h-3" /> : enCurso ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                </span>
                <span className="min-w-0">
                  <span className={enCurso ? 'font-semibold' : ''}>{e.titulo}</span>
                  {enCurso && PORQUE[e.id] && <span className="block text-xs text-[var(--ink-2)] mt-0.5">{PORQUE[e.id]}</span>}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-[var(--ink-2)]">{falla ? 'No se ha guardado nada.' : 'Puedes ocultarlo: sigue trabajando.'}</p>
          <Button variant="neutral" size="xs" type="button" onClick={onOcultar}>{falla ? 'Cerrar' : 'Ocultar'}</Button>
        </div>
      </div>
    </div>
  );
};
