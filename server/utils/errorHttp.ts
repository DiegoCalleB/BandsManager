/**
 * Respuestas de error seguras.
 *
 * Devolver `err.message` en un 5xx filtra al cliente detalles internos (errores de Postgres, rutas
 * de ficheros, mensajes de Stripe...) y casi nunca dice nada útil a quien lo lee. Aquí hay dos
 * caminos:
 *
 *  - Un error **de dominio**, pensado para que lo lea la persona («Esa banda ya existe»), se lanza
 *    como `ErrorHttp`: su estado y su mensaje se devuelven tal cual porque los ha escrito alguien.
 *  - Cualquier otro error es **inesperado**: el cliente recibe un mensaje genérico y un `idError`
 *    corto; el detalle queda en el log y en Sentry con ese mismo id para poder encontrarlo.
 */
import { randomUUID } from 'node:crypto';
import type { Response } from 'express';
import { captureError } from './errorTracking.js';

/** Error esperado, con estado HTTP y un mensaje apto para mostrar a la persona. */
export class ErrorHttp extends Error {
  readonly status: number;
  readonly codigo: string;

  constructor(status: number, codigo: string, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorHttp';
    this.status = status;
    this.codigo = codigo;
  }
}

/** Mensaje genérico cuando el sitio de la llamada no aporta uno propio. */
export const MENSAJE_ERROR_GENERICO = 'Error interno del servidor.';

/**
 * Responde a un error capturado en una ruta.
 *
 * @param res Respuesta de Express.
 * @param err Lo que se capturó (`unknown`).
 * @param mensaje Texto genérico que verá el cliente si el error es inesperado.
 */
export function responderError(res: Response, err: unknown, mensaje: string = MENSAJE_ERROR_GENERICO): Response {
  const req = res.req;
  // Si ya se enviaron las cabeceras no se puede responder otra vez, pero el fallo no debe perderse.
  if (res.headersSent) {
    captureError(err, { method: req?.method, url: req?.originalUrl });
    return res;
  }
  if (err instanceof ErrorHttp) {
    return res.status(err.status).json({ success: false, error: err.message, codigo: err.codigo });
  }
  const idError = randomUUID().slice(0, 8);
  console.error('[idError=%s] %s %s', idError, req?.method ?? '-', req?.originalUrl ?? '-');
  captureError(err, { idError, method: req?.method, url: req?.originalUrl });
  return res.status(500).json({ success: false, error: mensaje, idError });
}
