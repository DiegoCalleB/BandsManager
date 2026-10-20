import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

vi.mock('../../db/salasCatalogo.js', () => ({ puertoCatalogoSupabase: {} }));
const importar = vi.hoisted(() => vi.fn());
vi.mock('../importarSalasOsm.js', () => ({ importarSalasDeOsm: importar, descargarOsmSalas: vi.fn() }));
const semilla = vi.hoisted(() => vi.fn());
vi.mock('../importarSalasBandflow.js', () => ({ importarSalasDeBandflow: semilla }));
const capturar = vi.hoisted(() => vi.fn());
vi.mock('../../utils/errorTracking.js', () => ({ captureError: capturar }));

import { detenerSincronizacionDelCatalogo, importarSalasBandflowAhora, iniciarSincronizacionDelCatalogo, sincronizarCatalogoAhora } from '../catalogoScheduler.js';
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
  delete process.env.CATALOGO_IMPORTAR_OSM;
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
    expect(vi.getTimerCount()).toBe(3); // la primera pasada, el intervalo y la semilla de Bandflow, una sola vez
    detenerSincronizacionDelCatalogo();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('semilla de Bandflow', () => {
  afterEach(() => {
    delete process.env.CATALOGO_SEMILLA_BANDFLOW;
    detenerSincronizacionDelCatalogo();
    vi.useRealTimers();
  });

  it('se carga sola unos minutos tras arrancar, sin red, y se puede apagar', async () => {
    vi.useFakeTimers();
    semilla.mockReset();
    semilla.mockResolvedValue({ simulacion: false, salasEnSemilla: 3, nuevas: 3, completadas: 0, sinCambios: 0 });
    iniciarSincronizacionDelCatalogo();
    expect(semilla).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(9 * 60_000);
    expect(semilla).toHaveBeenCalledTimes(1);
    detenerSincronizacionDelCatalogo();

    process.env.CATALOGO_SEMILLA_BANDFLOW = 'false';
    semilla.mockClear();
    iniciarSincronizacionDelCatalogo();
    await vi.advanceTimersByTimeAsync(9 * 60_000);
    expect(semilla).not.toHaveBeenCalled();
  });

  it('un fallo se registra y no tumba nada', async () => {
    semilla.mockReset();
    capturar.mockClear();
    semilla.mockRejectedValue(new Error('sin base de datos'));
    await importarSalasBandflowAhora();
    expect(capturar).toHaveBeenCalledTimes(1);
  });
});

describe('importación de OpenStreetMap', () => {
  const ok = { simulacion: false, elementosLeidos: 10, descartados: { sinNombre: 2, sinCiudad: 3 }, ciudadPorCercania: 1, salasEnOsm: 5, nuevas: 5, completadas: 0, sinCambios: 0 };
  const arrancar = () => {
    vi.useFakeTimers();
    process.env.CATALOGO_IMPORTAR_OSM = 'true';
    importar.mockReset();
    iniciarSincronizacionDelCatalogo();
  };

  it('no se lanza si CATALOGO_IMPORTAR_OSM no es true', async () => {
    vi.useFakeTimers();
    importar.mockReset();
    iniciarSincronizacionDelCatalogo();
    await vi.advanceTimersByTimeAsync(20 * 60_000);
    expect(importar).not.toHaveBeenCalled();
  });

  it('se lanza una vez a los 15 minutos y, si sale bien, no se repite', async () => {
    arrancar();
    importar.mockResolvedValue(ok);
    await vi.advanceTimersByTimeAsync(14 * 60_000);
    expect(importar).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2 * 60_000);
    expect(importar).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(5 * 60 * 60_000);
    expect(importar).toHaveBeenCalledTimes(1);
  });

  it('si falla, se reintenta cada hora hasta tres veces más y se registra cada fallo', async () => {
    arrancar();
    importar.mockRejectedValue(new Error('Overpass no respondió en ningún servidor'));
    await vi.advanceTimersByTimeAsync(16 * 60_000);
    expect(importar).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(60 * 60_000);
    expect(importar).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(2 * 60 * 60_000);
    expect(importar).toHaveBeenCalledTimes(4);
    await vi.advanceTimersByTimeAsync(5 * 60 * 60_000);
    expect(importar).toHaveBeenCalledTimes(4);
    // La sincronización normal también puede registrar errores (aquí el puerto es de mentira): solo cuentan los de la importación.
    expect(capturar.mock.calls.filter((c) => c[1]?.fase === 'importarSalasOsm')).toHaveLength(4);
  });

  it('un reintento que sale bien detiene los siguientes', async () => {
    arrancar();
    importar.mockRejectedValueOnce(new Error('x')).mockResolvedValue(ok);
    await vi.advanceTimersByTimeAsync(16 * 60_000 + 60 * 60_000);
    expect(importar).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(5 * 60 * 60_000);
    expect(importar).toHaveBeenCalledTimes(2);
  });
});

