import { describe, expect, it, vi } from 'vitest';
import { SAVE_ERROR_EVENT, debeAvisar, instalarAvisoDeGuardados } from '../saveErrors';

function crearVentana(respuesta: () => Promise<Response>) {
  const eventos: any[] = [];
  const ventana: any = {
    fetch: vi.fn(respuesta),
    dispatchEvent: (e: any) => {
      eventos.push(e);
      return true;
    },
  };
  // CustomEvent existe en Node 22
  instalarAvisoDeGuardados(ventana);
  return { ventana, eventos };
}
const json = (status: number, cuerpo: any) => Promise.resolve(new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': 'application/json' } }));

describe('aviso de guardados fallidos', () => {
  it('avisa cuando una escritura recibe un error del servidor, con su mensaje', async () => {
    const { ventana, eventos } = crearVentana(() => json(500, { error: 'column "x" does not exist' }));
    const r = await ventana.fetch('/api/leads/lead-1', { method: 'PUT' });
    expect(r.status).toBe(500);
    expect(eventos).toHaveLength(1);
    expect(eventos[0].type).toBe(SAVE_ERROR_EVENT);
    expect(eventos[0].detail).toMatchObject({ ruta: '/api/leads/lead-1', metodo: 'PUT', status: 500, mensaje: 'column "x" does not exist' });
  });

  it('avisa si no hay red, y vuelve a lanzar el error original', async () => {
    const { ventana, eventos } = crearVentana(() => Promise.reject(new TypeError('Failed to fetch')));
    await expect(ventana.fetch('/api/state', { method: 'POST' })).rejects.toThrow('Failed to fetch');
    expect(eventos[0].detail).toMatchObject({ status: 0, mensaje: 'No hay conexión con el servidor.' });
  });

  it('no avisa de lecturas, éxitos, cancelaciones ni 401', async () => {
    const ok = crearVentana(() => json(200, {}));
    await ok.ventana.fetch('/api/leads', { method: 'POST' });
    const lectura = crearVentana(() => json(500, {}));
    await lectura.ventana.fetch('/api/leads');
    const sesion = crearVentana(() => json(401, {}));
    await sesion.ventana.fetch('/api/leads', { method: 'PUT' });
    const abort = crearVentana(() => Promise.reject(Object.assign(new Error('x'), { name: 'AbortError' })));
    await expect(abort.ventana.fetch('/api/leads', { method: 'PUT' })).rejects.toThrow();
    expect([ok.eventos, lectura.eventos, sesion.eventos, abort.eventos].flat()).toHaveLength(0);
  });

  it('ignora rutas públicas, de tracking y externas', () => {
    expect(debeAvisar('POST', '/api/public/deals/dl_1/sign', 400)).toBe(false);
    expect(debeAvisar('POST', '/api/tracking/interaction', 500)).toBe(false);
    expect(debeAvisar('POST', 'https://api.stripe.com/v1/x', 500)).toBe(false);
    expect(debeAvisar('DELETE', '/api/leads/lead-1?band=1', 500)).toBe(true);
  });

  it('avisa de un guardado parcial aunque la respuesta sea 200', async () => {
    const { ventana, eventos } = crearVentana(() =>
      Promise.resolve(new Response('{}', { status: 200, headers: { 'content-type': 'application/json', 'x-guardado-parcial': 'epk_configs.traducciones,epk_configs.miembros' } }))
    );
    const r = await ventana.fetch('/api/epk', { method: 'PUT' });
    expect(r.status).toBe(200);
    expect(eventos).toHaveLength(1);
    expect(eventos[0].detail.parcial).toBe(true);
    expect(eventos[0].detail.mensaje).toContain('epk_configs.traducciones, epk_configs.miembros');
  });

  it('se instala una sola vez', () => {
    const { ventana } = crearVentana(() => json(200, {}));
    const primera = ventana.fetch;
    instalarAvisoDeGuardados(ventana);
    expect(ventana.fetch).toBe(primera);
  });
});
