import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

vi.mock('../../db/salasCatalogo.js', () => ({ puertoCatalogoSupabase: {} }));
const capturar = vi.hoisted(() => vi.fn());
vi.mock('../../utils/errorTracking.js', () => ({ captureError: capturar }));

import { detenerSincronizacionDelCatalogo, iniciarSincronizacionDelCatalogo, sincronizarCatalogoAhora } from '../catalogoScheduler.js';
import type { InformeCatalogo } from '../catalogoSalas.js';

const informe: InformeCatalogo = {
  simulacion: false,
  leadsLeidos: 10,
  leadsSinClave: 0,
  leadsFueraDeCatalogo: { tipo: 0, prueba: 0 },
  salasResultantes: 8,
  salasNuevas: 2,
  salasActualizadas: 1,
  salasSinCambios: 5,
  duplicadosFusionados: 0,
  leadsEnlazados: 10,
  porNivel: { sin_verificar: 6, probable: 2, verificada: 0 },
};

beforeEach(() => {
  capturar.mockReset();
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => {
  detenerSincronizacionDelCatalogo();
  vi.useRealTimers();
  vi.restoreAllMocks();
  delete process.env.CATALOGO_SYNC;
});

describe('sincronizarCatalogoAhora', () => {
  it('devuelve el informe de la pasada', async () => {
    expect(await sincronizarCatalogoAhora(async () => informe)).toEqual(informe);
  });

  it('un fallo no lanza: se registra y devuelve null para que la siguiente pasada lo reintente', async () => {
    expect(await sincronizarCatalogoAhora(async () => { throw new Error('db caída'); })).toBeNull();
    expect(capturar).toHaveBeenCalledTimes(1);
    expect(await sincronizarCatalogoAhora(async () => informe)).toEqual(informe);
  });

  it('no solapa dos pasadas', async () => {
    let liberar: () => void = () => undefined;
    const lenta = sincronizarCatalogoAhora(() => new Promise<InformeCatalogo>((r) => { liberar = () => r(informe); }));
    expect(await sincronizarCatalogoAhora(async () => informe)).toBeNull();
    liberar();
    expect(await lenta).toEqual(informe);
  });
});

describe('iniciarSincronizacionDelCatalogo', () => {
  it('es idempotente y se puede apagar con CATALOGO_SYNC=false', () => {
    vi.useFakeTimers();
    process.env.CATALOGO_SYNC = 'false';
    iniciarSincronizacionDelCatalogo();
    expect(vi.getTimerCount()).toBe(0);

    delete process.env.CATALOGO_SYNC;
    iniciarSincronizacionDelCatalogo();
    iniciarSincronizacionDelCatalogo();
    expect(vi.getTimerCount()).toBe(2); // la primera pasada y el intervalo, una sola vez
    detenerSincronizacionDelCatalogo();
    expect(vi.getTimerCount()).toBe(0);
  });
});
