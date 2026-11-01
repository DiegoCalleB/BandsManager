/**
 * Asesor de Marketing, resultados por red (TikTok y YouTube). Invariantes:
 *  · el formato y el título los pone el servidor a partir de la acción «hecho»; los números se validan por red;
 *  · Instagram sigue por su camino y no se toca;
 *  · lo de una banda no lo ve ni lo pisa otra;
 *  · la lectura compara con lo habitual de la propia banda en esa red, no con umbrales inventados.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { crearFakeSupabaseTablas } from '../../db/__tests__/helpers/fakeSupabaseTablas';

const fake = crearFakeSupabaseTablas({ band_estrategia_marketing: [['band_id']], asesor_acciones: [['band_id', 'fecha', 'tarjeta_id']], asesor_resultados: [['band_id', 'fecha', 'tarjeta_id']], asesor_resultados_red: [['band_id', 'fecha', 'tarjeta_id', 'red']] });
vi.mock('../../db/core.js', async (orig) => ({ ...(await orig<any>()), getSupabase: () => fake.client }));
vi.mock('../../state.js', async (orig) => ({ ...(await orig<any>()), loadState: () => ({}), saveState: () => {} }));
const dna = { valor: null as unknown };
vi.mock('../../db.js', () => ({ dbGetEpkConfig: async () => null, dbGetRegisteredBandById: async () => ({ band_id: 'band-a', nombre_banda: 'Los Gatos', estilo_musical: 'rock', dna_expresion: dna.valor }) }));

const ia = { cliente: null as unknown, texto: '', respuestas: [] as string[], prompts: [] as string[] };
vi.mock('../../ai.js', () => ({
  getAiClient: () => ia.cliente,
  generateContentWithFallback: async (_c: unknown, p: { contents: string }) => {
    ia.prompts.push(p.contents);
    return { text: ia.respuestas.shift() ?? ia.texto };
  },
}));

import { asesorRouter } from '../asesor';

const handler = (metodo: string, ruta: string) => {
  const capa = (asesorRouter as any).stack.find((s: any) => s.route?.path === ruta && s.route.methods[metodo]);
  const pila = capa.route.stack;
  return pila[pila.length - 1].handle;
};
const resFalso = () => {
  const r: any = {};
  r.status = (c: number) => ((r.code = c), r);
  r.json = (b: any) => ((r.body = b), r);
  return r;
};
async function llamar(metodo: string, ruta: string, { body, bandId = 'band-a' }: { body?: any; bandId?: string } = {}) {
  const res = resFalso();
  await handler(metodo, ruta)({ user: { band_id: bandId, allowedBandIds: [bandId], role: 'leader' }, headers: {}, query: {}, params: {}, body }, res);
  return res;
}

beforeEach(() => {
  for (const t of Object.keys(fake.tablas)) fake.tablas[t].length = 0;
  ia.cliente = null;
  ia.texto = '';
  ia.respuestas = [];
  ia.prompts = [];
  dna.valor = null;
});
afterEach(() => vi.useRealTimers());

describe('resultados por red (TikTok y YouTube)', () => {
  const HOY = '2026-10-28T10:00:00Z';
  const hecha = (extra: Record<string, unknown> = {}) => ({ band_id: 'band-a', fecha: '2026-10-24', tarjeta_id: 'fondo-pilar', formato: 'reel', accion: 'hecho', titulo: 'Tema de la semana: La furgo', ...extra });
  const igMedido = (extra: Record<string, unknown> = {}) => ({ band_id: 'band-a', fecha: '2026-10-24', tarjeta_id: 'fondo-pilar', formato: 'reel', titulo: 'Tema de la semana: La furgo', alcance: 1000, guardados: 40, alcance_no_seguidores: 500, ...extra });
  const anotar = (body: unknown, bandId?: string) => llamar('post', '/asesor/resultado', { body, bandId });
  const base = { fecha: '2026-10-24', tarjetaId: 'fondo-pilar', red: 'tiktok', visualizaciones: 12000, guardados: 300 };
  const conRedes = (redes: string[]) => llamar('put', '/asesor/estrategia', { body: { redes } });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(HOY));
  });

  it('con Instagram medido, ofrece las otras redes del vídeo y deja de ofrecerlas cuando se anotan', async () => {
    await conRedes(['instagram', 'tiktok', 'youtube']);
    fake.tablas.asesor_acciones = [hecha()];
    fake.tablas.asesor_resultados = [igMedido()];
    const antes = (await llamar('get', '/asesor/hoy')).body;
    expect(antes.porMedir).toEqual([]); // el aviso de Hoy solo cuenta la red principal
    expect(antes.otrasRedes).toEqual([{ fecha: '2026-10-24', tarjetaId: 'fondo-pilar', formato: 'reel', titulo: 'Tema de la semana: La furgo', redes: ['tiktok', 'youtube'] }]);

    await anotar(base);
    expect((await llamar('get', '/asesor/hoy')).body.otrasRedes[0].redes).toEqual(['youtube']);
    await anotar({ fecha: '2026-10-24', tarjetaId: 'fondo-pilar', red: 'youtube', visualizaciones: 800 });
    expect((await llamar('get', '/asesor/hoy')).body.otrasRedes).toEqual([]);
  });

  it('guarda con el formato y el título del servidor y solo los campos de esa red', async () => {
    await conRedes(['instagram', 'tiktok']);
    fake.tablas.asesor_acciones = [hecha()];
    const res = await anotar({ ...base, formato: 'post', titulo: 'inventado', band_id: 'band-b', alcance: 5, metricas_raras: 'x' });
    expect(res.body).toMatchObject({ ok: true, titulo: 'Tema de la semana: La furgo', veredicto: 'sin_comparar' });
    expect(res.body.mensaje).toContain('Todavía no hay con qué compararlo');
    expect(fake.tablas.asesor_resultados_red).toHaveLength(1);
    expect(fake.tablas.asesor_resultados_red[0]).toMatchObject({ band_id: 'band-a', fecha: '2026-10-24', tarjeta_id: 'fondo-pilar', red: 'tiktok', formato: 'reel', titulo: 'Tema de la semana: La furgo' });
    expect(fake.tablas.asesor_resultados_red[0].metricas).toEqual({ visualizaciones: 12000, guardados: 300, compartidos: null, pctCompleto: null });
    expect(fake.tablas.asesor_resultados).toHaveLength(0); // Instagram no se toca
  });

  it('corregir sustituye lo anotado, y con tres piezas previas la lectura compara con lo habitual de la banda', async () => {
    await conRedes(['instagram', 'tiktok']);
    fake.tablas.asesor_acciones = [hecha(), ...['a', 'b', 'c'].map((id, i) => hecha({ fecha: `2026-10-2${i}`, tarjeta_id: id, titulo: `Reel ${id}` }))];
    fake.tablas.asesor_resultados_red = [1000, 2000, 3000].map((v, i) => ({ band_id: 'band-a', fecha: `2026-10-2${i}`, tarjeta_id: ['a', 'b', 'c'][i], red: 'tiktok', formato: 'reel', titulo: 'x', metricas: { visualizaciones: v } }));
    await anotar({ ...base, visualizaciones: 1000 });
    const res = await anotar({ ...base, visualizaciones: 4000 });
    expect(res.body).toMatchObject({ veredicto: 'por_encima' });
    expect(res.body.mensaje).toBe('Llegó más lejos de lo habitual: 2,0× vuestra mediana en TikTok. Repetid lo que hicisteis.');
    expect(fake.tablas.asesor_resultados_red.filter((r) => r.tarjeta_id === 'fondo-pilar')).toHaveLength(1);
  });

  it('rechaza lo que no vale con una frase clara y no escribe nada', async () => {
    await conRedes(['instagram', 'tiktok']);
    fake.tablas.asesor_acciones = [hecha(), hecha({ tarjeta_id: 'carrusel-x', formato: 'carrusel' })];
    for (const [body, motivo] of [
      [{ ...base, red: 'myspace' }, 'no es válida'], [{ ...base, red: 'youtube' }, 'no está en vuestra estrategia'], [{ ...base, visualizaciones: 0 }, 'mayor que 0'],
      [{ ...base, guardados: 99999 }, 'más personas de las que lo han visto'], [{ ...base, tarjetaId: 'carrusel-x' }, 'Solo los vídeos'],
    ] as const) {
      const res = await anotar(body);
      expect(res.code, JSON.stringify(body)).toBe(400);
      expect(res.body.error).toContain(motivo);
    }
    expect((await anotar({ ...base, tarjetaId: 'no-hecha' })).code).toBe(404);
    expect((await anotar({ ...base, fecha: 'ayer' })).code).toBe(404);
    expect(fake.tablas.asesor_resultados_red).toHaveLength(0);
  });

  it('lo de una banda no lo ve ni lo pisa otra', async () => {
    await conRedes(['instagram', 'tiktok']);
    fake.tablas.asesor_acciones = [hecha()];
    fake.tablas.asesor_resultados = [igMedido()];
    expect((await anotar(base, 'band-b')).code).toBe(404); // la acción «hecho» es de band-a
    await anotar(base);
    const otra = (await llamar('get', '/asesor/hoy', { bandId: 'band-b' })).body;
    expect(otra.otrasRedes).toEqual([]);
    expect(fake.tablas.asesor_resultados_red.every((r) => r.band_id === 'band-a')).toBe(true);
  });

  it('una banda solo de TikTok mide en TikTok: el aviso espera esos números y desaparece al anotarlos', async () => {
    await conRedes(['tiktok']);
    fake.tablas.asesor_acciones = [hecha()];
    const antes = (await llamar('get', '/asesor/hoy')).body;
    expect(antes.porMedir).toEqual([{ fecha: '2026-10-24', tarjetaId: 'fondo-pilar', formato: 'reel', titulo: 'Tema de la semana: La furgo', red: 'tiktok' }]);
    expect(antes.otrasRedes).toEqual([]);

    expect((await anotar(base)).body.ok).toBe(true);
    const despues = (await llamar('get', '/asesor/hoy')).body;
    expect(despues.porMedir).toEqual([]);
    expect(despues.agenda.flatMap((d: { eventos: unknown[] }) => d.eventos).find((e: any) => e.tipo === 'hecha')).toMatchObject({ lectura: 'sin_comparar' });
  });

  it('Instagram sigue por su camino, con `red` o sin ella, y su porMedir lleva red instagram', async () => {
    fake.tablas.asesor_acciones = [hecha()];
    const pendiente = (await llamar('get', '/asesor/hoy')).body.porMedir;
    expect(pendiente).toEqual([{ fecha: '2026-10-24', tarjetaId: 'fondo-pilar', formato: 'reel', titulo: 'Tema de la semana: La furgo', red: 'instagram' }]);
    const res = await anotar({ fecha: '2026-10-24', tarjetaId: 'fondo-pilar', red: 'instagram', alcance: 1000, guardados: 40, alcanceNoSeguidores: 500 });
    expect(res.body).toMatchObject({ ok: true, veredicto: 'funciona' });
    expect(fake.tablas.asesor_resultados).toHaveLength(1);
    expect(fake.tablas.asesor_resultados_red).toHaveLength(0);
  });

  it('el chat conoce lo anotado en TikTok y no lo de otra banda', async () => {
    await conRedes(['instagram', 'tiktok']);
    ia.cliente = {};
    ia.texto = JSON.stringify({ respuesta: 'Seguid con ese vídeo.', accion: null });
    fake.tablas.asesor_resultados_red = [
      { band_id: 'band-a', fecha: '2026-10-24', tarjeta_id: 'p', red: 'tiktok', formato: 'reel', titulo: 'Reel de La furgo', metricas: { visualizaciones: 12000 } },
      { band_id: 'band-b', fecha: '2026-10-24', tarjeta_id: 'q', red: 'tiktok', formato: 'reel', titulo: 'Secreto de otra banda', metricas: { visualizaciones: 7 } },
    ];
    await llamar('post', '/asesor/chat', { body: { mensajes: [{ rol: 'banda', texto: '¿Cómo nos va en TikTok?' }] } });
    expect(ia.prompts[0]).toContain('Reel de La furgo');
    expect(ia.prompts[0]).toContain('TikTok');
    expect(ia.prompts[0]).toContain('12000 visualizaciones');
    expect(ia.prompts[0]).not.toContain('Secreto de otra banda');
  });
});
