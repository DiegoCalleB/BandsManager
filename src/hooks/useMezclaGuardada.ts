import { useEffect, useState } from 'react';
import { claveMezclaAtril, leerMezcla, MEZCLA_VACIA, serializarMezcla, type MezclaGuardada } from '../utils/mezclaGuardada';

/** Mezcla por pista y velocidad del Atril, recordadas por canción en este dispositivo. */
export function useMezclaGuardada(songId: string | number) {
  const clave = claveMezclaAtril(songId);
  const [mezcla, setMezcla] = useState<{ clave: string; valor: MezclaGuardada }>(() => ({ clave, valor: cargar(clave) }));

  // Si el Atril cambia de canción, recarga lo guardado de esa.
  const actual = mezcla.clave === clave ? mezcla.valor : cargar(clave);
  useEffect(() => {
    if (mezcla.clave !== clave) setMezcla({ clave, valor: actual });
  }, [clave, mezcla.clave, actual]);

  useEffect(() => {
    if (mezcla.clave !== clave) return;
    try {
      const s = serializarMezcla(mezcla.valor);
      if (s) localStorage.setItem(clave, s);
      else localStorage.removeItem(clave);
    } catch { /* sin almacenamiento: vale solo esta sesión */ }
  }, [clave, mezcla]);

  const cambiar = (parcial: Partial<MezclaGuardada>) => setMezcla({ clave, valor: { ...actual, ...parcial } });
  return {
    ajustes: actual.ajustes,
    velocidad: actual.velocidad,
    setAjustes: (ajustes: MezclaGuardada['ajustes']) => cambiar({ ajustes }),
    setVelocidad: (velocidad: number) => cambiar({ velocidad }),
  };
}

function cargar(clave: string): MezclaGuardada {
  try { return leerMezcla(localStorage.getItem(clave)); } catch { return MEZCLA_VACIA; }
}
