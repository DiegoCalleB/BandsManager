import { useEffect, useState } from 'react';
import { crearEnlace } from '../../../utils/promocionApi';
import type { DestinoQr } from '../../../utils/cartel/config';

export interface EnlaceCartel {
  /** URL completa que codifica el QR. */
  url: string;
  /** La misma, sin protocolo, para escribirla bajo el cartel. */
  corta: string;
}

/**
 * Enlace corto del cartel (canal «cartel») al destino que elige la persona: la página del bolo, sus entradas o la
 * página de fans. El servidor lo reutiliza si ya existe, así que los escaneos se suman en la campaña del bolo.
 * Sin enlace el cartel sale sin QR.
 */
export function useEnlaceCartel(concertId: string, destino: DestinoQr): EnlaceCartel | null {
  const clave = `${concertId}|${destino}`;
  const [enlaces, setEnlaces] = useState<Record<string, EnlaceCartel | null>>({});

  useEffect(() => {
    if (!concertId || clave in enlaces) return;
    let vigente = true;
    crearEnlace({ concertId, destino, canal: 'cartel' })
      .then((r) => vigente && setEnlaces((p) => ({ ...p, [clave]: { url: r.url, corta: r.url.replace(/^https?:\/\//, '') } })))
      .catch((e) => {
        console.warn('[Cartelería] Sin enlace corto; el cartel sale sin QR:', e);
        if (vigente) setEnlaces((p) => ({ ...p, [clave]: null }));
      });
    return () => {
      vigente = false;
    };
  }, [concertId, destino, clave, enlaces]);

  return enlaces[clave] ?? null;
}
