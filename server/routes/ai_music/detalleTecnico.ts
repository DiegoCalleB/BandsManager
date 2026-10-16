import type { Request } from 'express';

/**
 * Detalle técnico de un fallo de audio/IA (stderr de ffmpeg, cuerpo del proveedor, errores de
 * base de datos). Solo lo ve un admin; el resto recibe el mensaje claro y nada más.
 */
export function detalleTecnico(req: Request, detalle: string | undefined): string | undefined {
  return req.user?.role === 'admin' ? detalle : undefined;
}
