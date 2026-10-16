import type { NextFunction, Request, Response } from 'express';

/**
 * Los agentes envían correos reales y gastan búsquedas: desde una sesión solo los lanza la
 * dirección de la banda (líder o admin). El cron entra sin usuario y no se ve afectado.
 */
export function soloDireccionSalvoCron(req: Request, res: Response, next: NextFunction) {
  const usuario = req.user;
  if (usuario && usuario.role !== 'leader' && usuario.role !== 'admin') {
    return res.status(403).json({ error: 'Solo la dirección de la banda puede lanzar agentes.' });
  }
  next();
}
