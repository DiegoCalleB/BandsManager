import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import { FESTIVALES } from '../festivales/datos.js';
import { filasCandidatas, nombreLimpio, parsearLista } from '../festivales/importar.js';
import { festivalDeFilas, festivalesDeFilas, type FilaConvocatoria, type FilaEdicion, type FilaFestival } from '../festivales/mapeo.js';
import { crearProveedorFestivales } from '../festivales/proveedor.js';
import { renderizarFestival } from '../festivales/render.js';
import { filasDeFichaFija } from '../festivales/semilla.js';

const HOY = '2026-10-19';
const BASE = 'https://bandmanager.io';
const fila = (extra: Partial<FilaFestival> = {}): FilaFestival => ({ id: 'f-uno', nombre: 'Festival Uno', ciudad: 'Soria', provincia: 'Soria', pais: 'ES', generos: ['indie'], web: 'https://uno.example/', descripcion_es: null, descripcion_en: null, estado_revision: 'completa', fuente: 'https://uno.example/', verificado_en: '2026-10-01', ...extra });
const edicion = (extra: Partial<FilaEdicion> = {}): FilaEdicion => ({ festival_id: 'f-uno', anio: 2027, inicio: '2027-07-01', fin: '2027-07-03', estado: 'confirmada', ...extra });
const conv = (extra: Partial<FilaConvocatoria> = {}): FilaConvocatoria => ({ festival_id: 'f-uno', edicion_anio: 2027, abre: '2026-11-01', cierra: '2027-01-15', url: 'https://uno.example/bases', estado: 'abierta', admite_independientes: 'si', exige_sello_o_agencia: 'no', exige_residencia: 'desconocido', cuota: 'no', remuneracion: null, resumen_es: null, resumen_en: null, ...extra });

describe('mapeo de filas a ficha pública', () => {
  it('una candidata nunca se publica, aunque tenga más datos', () => {
    expect(festivalDeFilas(fila({ estado_revision: 'candidata' }), [edicion()], [conv()], HOY)).toBeNull();
  });
  it('sin fuente, sin fecha de comprobación, sin lugar o sin estilos válidos no se publica', () => {
    for (const extra of [{ fuente: null }, { verificado_en: null }, { ciudad: null }, { provincia: null }, { generos: [] }, { generos: ['inventado'] }]) {
      expect(festivalDeFilas(fila(extra), [], [], HOY)).toBeNull();
    }
  });
  it('elige la próxima edición no cancelada y descarta las ya terminadas', () => {
    const f = festivalDeFilas(fila(), [edicion({ anio: 2026, inicio: '2026-07-01', fin: '2026-07-03' }), edicion({ anio: 2028, inicio: '2028-07-01', fin: '2028-07-02' }), edicion({ estado: 'cancelada', inicio: '2027-01-01', fin: '2027-01-02' }), edicion()], [], HOY);
    expect(f?.edicion).toEqual({ inicio: '2027-07-01', fin: '2027-07-03' });
  });
  it('elige la convocatoria vigente que cierra antes; si no hay, la última cerrada', () => {
    const tarde = conv({ cierra: '2027-03-01', url: 'https://uno.example/tarde' });
    expect(festivalDeFilas(fila(), [], [tarde, conv()], HOY)?.convocatoria?.url).toBe('https://uno.example/bases');
    const vieja = conv({ estado: 'cerrada', cierra: '2026-01-01', url: 'https://uno.example/vieja' });
    expect(festivalDeFilas(fila(), [], [vieja], HOY)?.convocatoria?.url).toBe('https://uno.example/vieja');
  });
  it('una convocatoria marcada abierta cuyo plazo ya pasó no cuenta como vigente', () => {
    const f = festivalDeFilas(fila(), [], [conv({ cierra: '2026-10-18' })], HOY);
    expect(f?.convocatoria?.cierre).toBe('2026-10-18');
  });
  it('los requisitos desconocidos siguen siendo desconocidos, no «no»', () => {
    const r = festivalDeFilas(fila(), [], [conv()], HOY)?.convocatoria?.requisitos;
    expect(r).toMatchObject({ independientes: 'si', exigeSelloOAgencia: 'no', exigeResidencia: 'desconocido' });
  });
  it('agrupa las filas por festival', () => {
    const fichas = festivalesDeFilas([fila(), fila({ id: 'f-dos', estado_revision: 'candidata' })], [edicion()], [conv(), conv({ festival_id: 'f-dos' })], HOY);
    expect(fichas.map((f) => f.slug)).toEqual(['f-uno']);
  });
  it('la ficha de requisitos sale en la página, con «Sin confirmar» donde no se sabe', () => {
    const f = festivalDeFilas(fila(), [edicion()], [conv()], HOY)!;
    const html = renderizarFestival(f, BASE, 'es', HOY, [f]);
    expect(html).toContain('Admite músicos independientes');
    expect(html).toContain('Sin confirmar');
  });
});

describe('proveedor con respaldo', () => {
  const unaFicha = [FESTIVALES[0]];
  it('usa la base de datos cuando tiene fichas', async () => {
    const p = crearProveedorFestivales(async () => unaFicha, FESTIVALES);
    expect(await p()).toBe(unaFicha);
  });
  it('si la base está vacía o falla, usa las fichas fijas', async () => {
    expect(await crearProveedorFestivales(async () => [], FESTIVALES)()).toBe(FESTIVALES);
    const alFallar = vi.fn();
    expect(await crearProveedorFestivales(async () => { throw new Error('caída'); }, FESTIVALES, { alFallar })()).toBe(FESTIVALES);
    expect(alFallar).toHaveBeenCalledOnce();
  });
  it('guarda el resultado el TTL y reintenta pronto tras un fallo', async () => {
    let t = 0;
    const cargar = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue(unaFicha);
    const p = crearProveedorFestivales(cargar, FESTIVALES, { ttlMs: 600_000, ahora: () => t });
    await p(); await p();
    expect(cargar).toHaveBeenCalledTimes(1);
    t = 31_000;
    expect(await p()).toBe(unaFicha);
    t = 100_000; await p();
    expect(cargar).toHaveBeenCalledTimes(2);
  });
});

describe('carga desde la lista de trabajo', () => {
  const md = fs.readFileSync('docs/master/marketing/FESTIVALES_PENDIENTES.md', 'utf8');
  const items = parsearLista(md);
  it('lee la lista real y convierte estilos y meses', () => {
    expect(items.length).toBeGreaterThan(400);
    const vina = items.find((i) => i.nombre === 'Viña Rock');
    expect(vina).toMatchObject({ comunidad: 'Castilla-La Mancha', mes: 5, yaPublicado: true });
    expect(vina?.estilos).toContain('rock');
    expect(items.find((i) => i.nombre === 'Pirata Beach Festival')?.comunidad).toBe('Comunidad Valenciana');
  });
  it('genera slugs seguros y únicos, y no recrea lo ya publicado', () => {
    const filas = filasCandidatas(items, FESTIVALES.map((f) => f.slug));
    expect(new Set(filas.map((f) => f.id)).size).toBe(filas.length);
    for (const f of filas) { expect(f.id).toMatch(/^[a-z0-9-]+$/); expect(f.estado_revision).toBe('candidata'); }
    expect(filas.some((f) => f.nombre === 'Viña Rock')).toBe(false);
    expect(filas.length).toBeGreaterThan(400);
  });
  it('un slug repetido recibe sufijo y uno ocupado se respeta', () => {
    const base = { comunidad: null, mes: null, estilos: [], yaPublicado: false };
    const filas = filasCandidatas([{ ...base, nombre: 'Rock Fest' }, { ...base, nombre: 'Rock  Fest' }, { ...base, nombre: 'Otro' }], ['otro']);
    expect(filas.map((f) => f.id)).toEqual(['rock-fest', 'rock-fest-2', 'otro-2']);
  });
  it('quita los paréntesis explicativos del nombre', () => {
    expect(nombreLimpio('Pirata Beach Festival (varias sedes: X)')).toBe('Pirata Beach Festival');
  });
  it('las fichas fijas se siembran con su edición y su convocatoria', () => {
    const fim = filasDeFichaFija(FESTIVALES.find((f) => f.slug === 'fim-vila-seca')!);
    expect(fim.festival).toMatchObject({ id: 'fim-vila-seca', estado_revision: 'completa' });
    expect(fim.edicion).toMatchObject({ anio: 2027, estado: 'confirmada' });
    expect(fim.convocatoria).toMatchObject({ cierra: '2026-10-23' });
    const { web: _web, ...sinWeb } = FESTIVALES.find((f) => f.slug === 'vina-rock')!;
    const vina = filasDeFichaFija(sinWeb);
    expect(vina.festival).toMatchObject({ estado_revision: 'minima' });
    expect(vina.edicion).toBeUndefined();
  });
});
