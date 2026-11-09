/**
 * Fiabilidad de un email de contacto (0-100), calculada SOLO con evidencia: de dónde salió, cuándo se volvió a ver y
 * qué pasó al escribirle. Nunca se deduce de la forma del email. La comparten el Enviador (no escribe por debajo de
 * {@link UMBRAL_ENVIO}) y la interfaz (muestra el nivel y el motivo). Regla de AGENTS.md §3: sin evidencia no entran.
 */

export type NivelFiabilidad = 'confirmado' | 'publicado' | 'banda' | 'institucional' | 'caducado' | 'descartado';

export interface ProcedenciaEmail {
  fuente?: string;
  /** Primera vez que se anotó. */
  en?: string;
  /** Última vez que el agente lo volvió a ver escrito en la web del festival. */
  verificado_en?: string;
  /** El festival respondió desde ese buzón. */
  confirmado_por_respuesta?: boolean;
  aviso?: { tipo?: string; para?: string };
}

export interface EmailConEvidencia {
  email?: string | null;
  procedencia?: ProcedenciaEmail | null;
  /** Un envío a ese buzón rebotó. */
  rebotado?: boolean;
}

export interface Fiabilidad {
  puntos: number;
  nivel: NivelFiabilidad;
  motivo: string;
}

/** Por debajo de esto el Enviador no escribe: caducados, IA, buscador, rebotes y dominios dudosos. */
export const UMBRAL_ENVIO = 75;
/** Una evidencia web que nadie ha vuelto a comprobar en este tiempo deja de valer como «publicado». */
export const DIAS_VIGENCIA_WEB = 90;

const DIA_MS = 86_400_000;

export function fiabilidadDelEmail(dato: EmailConEvidencia, ahora: Date = new Date()): Fiabilidad {
  const email = dato.email?.trim().toLowerCase() ?? '';
  if (!email) return { puntos: 0, nivel: 'descartado', motivo: 'Sin email.' };
  if (dato.rebotado) return { puntos: 0, nivel: 'descartado', motivo: 'Un envío a este buzón rebotó.' };

  const p = dato.procedencia ?? null;
  if (p?.confirmado_por_respuesta) return { puntos: 100, nivel: 'confirmado', motivo: 'El festival ha respondido desde este buzón.' };
  if (p?.aviso?.tipo === 'dominio_inexistente' && p.aviso.para?.trim().toLowerCase() === email) {
    return { puntos: 0, nivel: 'descartado', motivo: 'El dominio de este email no recibe correo.' };
  }
  if (!p?.fuente) return { puntos: 80, nivel: 'banda', motivo: 'Lo escribió una persona de la banda; no tiene evidencia automática.' };

  switch (p.fuente) {
    case 'web':
    case 'places': {
      const visto = Date.parse(p.verificado_en || p.en || '');
      const dias = Number.isNaN(visto) ? Infinity : (ahora.getTime() - visto) / DIA_MS;
      return dias <= DIAS_VIGENCIA_WEB
        ? { puntos: 90, nivel: 'publicado', motivo: 'Publicado en la web del festival y comprobado hace poco.' }
        : { puntos: 50, nivel: 'caducado', motivo: `Se leyó en su web hace más de ${DIAS_VIGENCIA_WEB} días; hay que volver a comprobarlo.` };
    }
    case 'persona': {
      const visto = Date.parse(p.verificado_en || p.en || '');
      const dias = Number.isNaN(visto) ? Infinity : (ahora.getTime() - visto) / DIA_MS;
      return dias <= DIAS_VIGENCIA_WEB
        ? { puntos: 85, nivel: 'banda', motivo: 'Una persona de la banda lo ha confirmado hace poco.' }
        : { puntos: 50, nivel: 'caducado', motivo: `Se confirmó hace más de ${DIAS_VIGENCIA_WEB} días; hay que volver a comprobarlo.` };
    }
    case 'catalogo':
      return { puntos: 75, nivel: 'institucional', motivo: 'Sale de una ficha oficial o del catálogo, no de la web del festival.' };
    default:
      return { puntos: 0, nivel: 'descartado', motivo: 'Lo propuso una IA o un buscador y nadie lo ha visto en una web.' };
  }
}

export const sePuedeEnviar = (f: Fiabilidad): boolean => f.puntos >= UMBRAL_ENVIO;
