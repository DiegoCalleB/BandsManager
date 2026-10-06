import React, { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { IconButton } from './ui';
import { SAVE_ERROR_EVENT, type SaveErrorDetail } from '../utils/saveErrors';

interface Aviso extends SaveErrorDetail {
  id: number;
}

const MAX_AVISOS = 3;

/**
 * Aviso persistente cuando un guardado falla. No desaparece solo: un cambio que no se guardó
 * hay que verlo. Los avisos repetidos de la misma ruta se funden en uno.
 */
export const SaveErrorBanner: React.FC = () => {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  useEffect(() => {
    let siguiente = 1;
    const alFallar = (e: Event) => {
      const detalle = (e as CustomEvent<SaveErrorDetail>).detail;
      if (!detalle) return;
      setAvisos((previos) => {
        const sinRepetido = previos.filter((a) => !(a.ruta === detalle.ruta && a.metodo === detalle.metodo));
        return [...sinRepetido, { ...detalle, id: siguiente++ }].slice(-MAX_AVISOS);
      });
    };
    window.addEventListener(SAVE_ERROR_EVENT, alFallar);
    return () => window.removeEventListener(SAVE_ERROR_EVENT, alFallar);
  }, []);

  if (avisos.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-5 z-[60] flex flex-col gap-2 sm:max-w-sm sm:w-full pointer-events-none"
    >
      {avisos.map((a) => (
        <div key={a.id} className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-[var(--r-l)] bg-[var(--alert-soft)] text-[var(--ink)]">
          <AlertCircle className="w-5 h-5 text-[var(--alert)] shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold leading-tight">{a.parcial ? 'Guardado incompleto' : 'No se pudo guardar el cambio'}</h4>
            <p className="text-xs opacity-80 mt-0.5">{a.mensaje}</p>
            <p className="text-[11px] opacity-60 mt-1 break-all">{a.metodo} {a.ruta}</p>
          </div>
          <IconButton label="Cerrar aviso" size="icon-xs" onClick={() => setAvisos((p) => p.filter((x) => x.id !== a.id))} className="shrink-0">
            <X className="w-3.5 h-3.5" />
          </IconButton>
        </div>
      ))}
    </div>
  );
};
