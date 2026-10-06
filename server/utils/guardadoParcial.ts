/**
 * Guardado parcial: cuando la BD no tiene alguna columna (migración sin aplicar) el servidor
 * reintenta la escritura SIN esa columna para no perder el resto de lo que escribió el usuario.
 * Eso evita el error, pero esconde que un campo no se guardó. Este módulo lo hace visible:
 * apunta las columnas omitidas durante la petición y las devuelve en la cabecera
 * `X-Guardado-Parcial`, que el cliente convierte en un aviso en pantalla.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import type { NextFunction, Request, Response } from 'express';

export const CABECERA_GUARDADO_PARCIAL = 'X-Guardado-Parcial';

const almacen = new AsyncLocalStorage<Set<string>>();

/** Apunta `tabla.columna` como omitida en la petición en curso (si hay una). */
export function registrarColumnaOmitida(tabla: string, columna: string): void {
  almacen.getStore()?.add(`${tabla}.${columna}`);
}

export function columnasOmitidasEnPeticion(): string[] {
  return [...(almacen.getStore() ?? [])];
}

/** Middleware: abre el registro por petición y vuelca lo omitido en la cabecera al responder. */
export function avisarGuardadoParcial() {
  return (_req: Request, res: Response, next: NextFunction) => {
    const omitidas = new Set<string>();
    const writeHead = res.writeHead.bind(res) as (...args: any[]) => Response;
    (res as any).writeHead = (...args: any[]) => {
      if (omitidas.size && !res.headersSent) res.setHeader(CABECERA_GUARDADO_PARCIAL, [...omitidas].join(','));
      return writeHead(...args);
    };
    almacen.run(omitidas, next);
  };
}
