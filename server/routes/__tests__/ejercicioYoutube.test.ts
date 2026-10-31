/**
 * /ejercicio_youtube_crm sirve el .html suelto del build. Invariantes:
 *  · la ruta existe y es GET;
 *  · envía dist/ejercicio_youtube_crm.html sin caché;
 *  · si el archivo no existe, pasa a la SPA (next) en vez de devolver un error.
 */
import { describe, expect, it } from 'vitest';
import path from 'node:path';
import router, { ARCHIVO_EJERCICIO_YOUTUBE } from '../ejercicioYoutube';

function manejador() {
  const capa = (router as any).stack.find((s: any) => s.route?.path === '/ejercicio_youtube_crm' && s.route.methods.get);
  expect(capa).toBeDefined();
  return capa.route.stack[capa.route.stack.length - 1].handle;
}

describe('página del ejercicio de YouTube', () => {
  it('apunta a dist/ejercicio_youtube_crm.html', () => {
    expect(ARCHIVO_EJERCICIO_YOUTUBE()).toBe(path.join(process.cwd(), 'dist', 'ejercicio_youtube_crm.html'));
  });

  it('envía el archivo sin caché', () => {
    const cab: Record<string, string> = {};
    let enviado = '';
    const res: any = { setHeader: (k: string, v: string) => (cab[k] = v), sendFile: (f: string) => (enviado = f) };
    manejador()({}, res, () => {});
    expect(enviado).toBe(ARCHIVO_EJERCICIO_YOUTUBE());
    expect(cab['Cache-Control']).toBe('no-store');
  });

  it('si no hay archivo, deja pasar a la SPA', () => {
    let siguiente = 0;
    const res: any = { setHeader: () => {}, sendFile: (_f: string, cb: (e?: Error) => void) => cb(new Error('ENOENT')) };
    manejador()({}, res, () => siguiente++);
    expect(siguiente).toBe(1);
  });
});
