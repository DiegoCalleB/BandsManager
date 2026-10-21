// Conciertos y giras son cosa de la dirección (líder o admin): el caché, el contrato y los gastos
// no los toca cualquier miembro. Un miembro sí puede editar el resto del concierto (setlist,
// notas, horarios, QR) porque lo hace en el día a día; crearlo, borrarlo o tocar el dinero, no.
import type { NextFunction, Request, Response } from 'express';
import { dbGetConcertDeBanda } from '../db/concerts.js';
import { getTargetBandId } from './bandAccess.js';

type Tipo = 'numero' | 'booleano' | 'texto' | 'objeto';
/** Campo del concierto que mueve dinero o contrato: [nombre en la base, nombre en el cliente, tipo]. */
const CAMPOS_DE_DINERO: ReadonlyArray<readonly [string, string, Tipo]> = [
  ['cache', 'cache', 'numero'],
  ['contrato_firmado', 'contratoFirmado', 'booleano'],
  ['estado_pago', 'estadoPago', 'texto'],
  ['gastos_detalle', 'gastosDetalle', 'objeto'],
  ['gastos_estimados_tipicos', 'gastosEstimadosTipicos', 'numero'],
  ['precio_entrada_estimado', 'precioEntradaEstimado', 'numero'],
];

const normalizar = (valor: unknown, tipo: Tipo): string => {
  if (tipo === 'numero') return String(Number(valor || 0));
  if (tipo === 'booleano') return String(Boolean(valor));
  if (tipo === 'texto') return String(valor ?? '');
  return JSON.stringify(valor ?? {});
};

/** Campos de dinero o contrato que la petición cambia respecto al concierto guardado. */
export function camposDeDineroCambiados(actual: Record<string, unknown> | null, cuerpo: Record<string, unknown>): string[] {
  const cambiados: string[] = [];
  for (const [columna, cliente, tipo] of CAMPOS_DE_DINERO) {
    const enviado = columna in cuerpo ? cuerpo[columna] : cuerpo[cliente];
    if (enviado === undefined) continue;
    const guardado = actual ? (actual[columna] ?? actual[cliente]) : undefined;
    if (normalizar(enviado, tipo) !== normalizar(guardado, tipo)) cambiados.push(columna);
  }
  return cambiados;
}

export const SOLO_DIRECCION_DINERO = 'Solo la dirección de la banda puede cambiar el caché, el contrato o los gastos de un concierto.';

/** `PUT /concerts/:id`: un miembro puede editar el concierto, pero no su dinero ni su contrato. */
export async function soloDireccionSiTocaDinero(req: Request, res: Response, next: NextFunction) {
  const rol = req.user?.role;
  if (rol === 'leader' || rol === 'admin') return next();
  try {
    const actual = await dbGetConcertDeBanda(String(req.params.id), getTargetBandId(req));
    if (camposDeDineroCambiados(actual as Record<string, unknown> | null, (req.body ?? {}) as Record<string, unknown>).length) {
      return res.status(403).json({ error: SOLO_DIRECCION_DINERO });
    }
    return next();
  } catch (err) {
    return next(err);
  }
}
