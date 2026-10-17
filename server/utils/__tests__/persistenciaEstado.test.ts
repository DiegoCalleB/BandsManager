import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { crearEscritorDiferido } from '../persistenciaEstado';

let dir: string;
let ruta: string;

beforeEach(() => {
  vi.useFakeTimers();
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'estado-'));
  ruta = path.join(dir, 'data.json');
});
afterEach(() => {
  vi.useRealTimers();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('crearEscritorDiferido', () => {
  it('no escribe en disco hasta que pasa el retraso', async () => {
    const e = crearEscritorDiferido({ ruta, serializar: () => '{"v":1}', retrasoMs: 2000 });
    e.programar();
    expect(fs.existsSync(ruta)).toBe(false);
    await vi.advanceTimersByTimeAsync(2000);
    await e.inactivo();
    expect(fs.readFileSync(ruta, 'utf8')).toBe('{"v":1}');
  });

  it('agrupa muchas peticiones en una sola escritura con el último contenido', async () => {
    let v = 0;
    const serializar = vi.fn(() => JSON.stringify({ v }));
    const e = crearEscritorDiferido({ ruta, serializar, retrasoMs: 2000 });
    for (v = 1; v <= 50; v++) e.programar();
    await vi.advanceTimersByTimeAsync(2000);
    await e.inactivo();
    expect(serializar).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fs.readFileSync(ruta, 'utf8'))).toEqual({ v: 51 });
  });

  it('vaciar escribe de forma síncrona lo pendiente y cancela el temporizador', async () => {
    const serializar = vi.fn(() => '{"v":2}');
    const e = crearEscritorDiferido({ ruta, serializar, retrasoMs: 2000 });
    e.programar();
    e.vaciar();
    expect(fs.readFileSync(ruta, 'utf8')).toBe('{"v":2}');
    await vi.advanceTimersByTimeAsync(5000);
    await e.inactivo();
    expect(serializar).toHaveBeenCalledTimes(1);
  });

  it('vaciar sin nada pendiente no toca el disco', () => {
    const e = crearEscritorDiferido({ ruta, serializar: () => 'x', retrasoMs: 2000 });
    e.vaciar();
    expect(fs.existsSync(ruta)).toBe(false);
  });

  it('un fallo de escritura se registra y no rompe al llamador', async () => {
    const aviso = vi.spyOn(console, 'error').mockImplementation(() => {});
    const e = crearEscritorDiferido({ ruta: path.join(dir, 'no', 'existe', 'data.json'), serializar: () => '{}', retrasoMs: 10 });
    e.programar();
    await vi.advanceTimersByTimeAsync(10);
    await expect(e.inactivo()).resolves.toBeUndefined();
    expect(aviso).toHaveBeenCalled();
    aviso.mockRestore();
  });

  it('tras escribir, un nuevo programar vuelve a agendar otra escritura', async () => {
    let v = 1;
    const e = crearEscritorDiferido({ ruta, serializar: () => JSON.stringify({ v }), retrasoMs: 100 });
    e.programar();
    await vi.advanceTimersByTimeAsync(100);
    await e.inactivo();
    v = 2;
    e.programar();
    await vi.advanceTimersByTimeAsync(100);
    await e.inactivo();
    expect(JSON.parse(fs.readFileSync(ruta, 'utf8'))).toEqual({ v: 2 });
  });

  it('si no hay nada que serializar (caché invalidada) no escribe un fichero vacío o "null"', async () => {
    const e = crearEscritorDiferido({ ruta, serializar: () => null, retrasoMs: 10 });
    e.programar();
    await vi.advanceTimersByTimeAsync(10);
    await e.inactivo();
    expect(fs.existsSync(ruta)).toBe(false);
    e.programar();
    e.vaciar();
    expect(fs.existsSync(ruta)).toBe(false);
  });
});
