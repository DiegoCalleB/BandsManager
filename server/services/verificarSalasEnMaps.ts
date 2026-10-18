/**
 * Verificación periódica de las salas del catálogo en Google Maps: ¿siguen abiertas?
 *
 * No destructiva: solo anota el estado de cada sala (las cerradas definitivamente dejan de salir en las consultas) y no
 * borra nada ni toca la agenda de ninguna banda. Procesa unas pocas salas por pasada, las que llevan más tiempo sin
 * comprobarse, para acotar el gasto de la API de Places. Depende de puertos, no de Supabase ni de Google.
 */
import { esLaMismaSala, estadoDeGoogle, type EstadoNegocio, type LugarDeMaps } from '../utils/estadoNegocio.js';
import type { SalaGuardada } from './catalogoSalas.js';

export interface PuertoVerificacion {
  /** Salas sin comprobar o comprobadas antes de `antesDe`, las más antiguas primero. */
  salasPendientes(limite: number, antesDe: Date): Promise<SalaGuardada[]>;
  guardarEstado(salaId: string, estado: EstadoNegocio, en: Date): Promise<void>;
}

/** El lugar de Maps que corresponde a la sala, o null si Maps no devuelve ninguno. Lanza si la consulta falla. */
export type ConsultaMaps = (sala: Pick<SalaGuardada, 'place_id' | 'nombre' | 'ciudad'>) => Promise<LugarDeMaps | null>;

export interface InformeVerificacion {
  revisadas: number;
  operativas: number;
  cerradasTemporal: number;
  cerradasPermanente: number;
  /** Maps no devolvió la misma sala: queda sin verificar, sin tocar nada. */
  sinCoincidencia: number;
  errores: number;
}

export const SALAS_POR_PASADA = 40;
export const DIAS_HASTA_REVERIFICAR = 90;
const ERRORES_SEGUIDOS_PARA_PARAR = 3;

export async function verificarSalasEnMaps(p: {
  puerto: PuertoVerificacion;
  consultarMaps: ConsultaMaps;
  ahora?: () => Date;
  limite?: number;
  diasHastaReverificar?: number;
}): Promise<InformeVerificacion> {
  const ahora = p.ahora ?? (() => new Date());
  const antesDe = new Date(ahora().getTime() - (p.diasHastaReverificar ?? DIAS_HASTA_REVERIFICAR) * 86_400_000);
  const informe: InformeVerificacion = { revisadas: 0, operativas: 0, cerradasTemporal: 0, cerradasPermanente: 0, sinCoincidencia: 0, errores: 0 };
  let erroresSeguidos = 0;

  for (const sala of await p.puerto.salasPendientes(p.limite ?? SALAS_POR_PASADA, antesDe)) {
    let lugar: LugarDeMaps | null;
    try {
      lugar = await p.consultarMaps(sala);
      erroresSeguidos = 0;
    } catch {
      // Un fallo de red o de cuota no dice nada de la sala: no se escribe y se reintenta en otra pasada.
      informe.errores++;
      if (++erroresSeguidos >= ERRORES_SEGUIDOS_PARA_PARAR) break;
      continue;
    }
    informe.revisadas++;
    const estado = lugar && esLaMismaSala(sala, lugar) ? estadoDeGoogle(lugar.businessStatus) : null;
    if (!estado) {
      informe.sinCoincidencia++;
      // Se anota la fecha para que pase al final de la cola en vez de bloquearla en cada pasada.
      await p.puerto.guardarEstado(sala.id, 'sin_verificar', ahora());
      continue;
    }
    await p.puerto.guardarEstado(sala.id, estado, ahora());
    if (estado === 'operativo') informe.operativas++;
    else if (estado === 'cerrado_temporal') informe.cerradasTemporal++;
    else informe.cerradasPermanente++;
  }
  return informe;
}
