import { useCallback, useEffect, useState, type RefObject } from 'react';

export interface AutoScroll {
  activo: boolean;
  setActivo: (v: boolean) => void;
  velocidad: number;
  setVelocidad: (v: number) => void;
  alternar: () => void;
}

const PX_POR_TICK = 0.85;
const MARGEN_FIN_PX = 8;

/** Desplazamiento automático suave de un contenedor (1x, 2x, 3x). Se detiene solo al llegar al final. */
export function useAutoScroll(ref: RefObject<HTMLElement | null>, velocidadInicial = 2, habilitado = true): AutoScroll {
  const [activo, setActivo] = useState(false);
  const [velocidad, setVelocidad] = useState(velocidadInicial);

  useEffect(() => {
    if (!activo || !habilitado) return;
    const t = setInterval(() => {
      const el = ref.current;
      if (!el) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - MARGEN_FIN_PX) setActivo(false);
      else el.scrollTop += velocidad * PX_POR_TICK;
    }, 50);
    return () => clearInterval(t);
  }, [activo, velocidad, habilitado, ref]);

  const alternar = useCallback(() => setActivo((a) => !a), []);
  return { activo, setActivo, velocidad, setVelocidad, alternar };
}
