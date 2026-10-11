// `requireAuth`, `requireLeader` y `requireCronOrAuth` (server/auth.ts) dejan el usuario de la
// sesión en `req.user`. Declararlo aquí permite leerlo tipado en vez de con `req.user`.
import type { UsuarioDeSesion } from '../auth.js';

declare global {
  namespace Express {
    interface Request {
      user?: UsuarioDeSesion;
    }
  }
}

export {};
