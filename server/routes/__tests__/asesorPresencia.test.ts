/**
 * Asesor de Marketing, presencia (auditoría 360, kit SEO y clics de los enlaces). Invariantes:
 *  · solo lee y no usa IA: todo sale de lo que BandManager ya sabe de ESA banda;
 *  · lo que no se sabe sale como «sin datos», nunca como bueno ni como malo;
 *  · solo se auditan las redes de la estrategia y el bolo que cuenta es el próximo bolo público;
 *  · la bio pegada manda sobre la leída de Instagram, y si Instagram falla no se rompe nada;
 *  · lo de una banda no se mezcla con lo de otra.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { crearFakeSupabaseTablas } from '../../db/__tests__/helpers/fakeSupabaseTablas';

const fake = crearFakeSupabaseTablas({ band_estrategia_marketing: [['band_id']], asesor_acciones: [['band_id', 'fecha', 'tarjeta_id']] });
vi.mock('../../db/core.js', async (orig) => ({ ...(await orig<any>()), getSupabase: () => fake.client }));
vi.mock('../../state.js', async (orig) => ({ ...(await orig<any>()), loadState: () => ({}), saveState: () => {} }));

const datos = {
  epk: {} as Record<string, any>,
  banda: {} as Record<string, any>,
  conciertos: [] as any[],
  enlaces: [] as any[],
  clics: [] as any[],
  credenciales: null as null | { token: string; igUserId: string },
};
vi.mock('../../db.js', () => ({ dbGetEpkConfig: async () => datos.epk, dbGetRegisteredBandById: async () => datos.banda }));
vi.mock('../../db/concerts.js', () => ({ dbGetConcerts: async () => datos.conciertos }));
vi.mock('../../db/enlacesCortos.js', () => ({ dbListarEnlaces: async () => datos.enlaces, dbClicsDeBanda: async () => datos.clics }));
vi.mock('../../services/credencialesInstagram.js', () => ({ credencialesInstagram: async () => datos.credenciales }));

import { asesorRouter } from '../asesor';
import { destinoRecomendado, presenciaDeLaBanda, sanearBios } from '../../services/asesorPresencia';

const AHORA = new Date('2026-10-28T10:00:00Z');
const resFalso = () => {
  const r: any = {};
  r.status = (c: number) => ((r.code = c), r);
  r.json = (b: any) => ((r.body = b), r);
  return r;
};
async function llamar(body?: any, bandId = 'band-a') {
  const capa = (asesorRouter as any).stack.find((s: any) => s.route?.path === '/asesor/presencia' && s.route.methods.post);
  const res = resFalso();
  await capa.route.stack[capa.route.stack.length - 1].handle({ user: { band_id: bandId, allowedBandIds: [bandId], role: 'leader' }, headers: {}, query: {}, params: {}, body }, res);
  return res;
}
const hallazgo = (p: any, id: string) => p.auditoria.especialistas.flatMap((e: any) => e.hallazgos).find((h: any) => h.id === id);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(AHORA);
  for (const t of Object.keys(fake.tablas)) fake.tablas[t].length = 0;
  datos.banda = { band_id: 'band-a', nombre_banda: 'Ruta 66', estilo_musical: 'Rock', localizacion: 'Madrid' };
  datos.epk = {
    biografia: 'Ruta 66 es una banda de rock de Madrid con tres años de directos.', fraseImpacto: 'Rock de furgoneta', logoUrl: 'https://x/logo.png',
    bandPhotos: ['a', 'b', 'c'], contactoBooking: { email: 'booking@ruta66.es' },
    enlacesRedes: { instagram: 'https://instagram.com/ruta66', tiktok: 'https://tiktok.com/@ruta66', spotify: 'https://open.spotify.com/artist/x' },
  };
  datos.conciertos = []; datos.enlaces = []; datos.clics = []; datos.credenciales = null;
});

describe('presencia de la banda', () => {
  it('con una banda normal revisa sus redes con los datos que hay y pide lo que falta, sin inventar', async () => {
    const res = await llamar();
    expect(res.code).toBeUndefined();
    const p = res.body;
    expect(p.auditoria.especialistas.map((e: any) => e.id)).toEqual(['seo', 'instagram', 'tiktok', 'ctr']); // redes de serie: Instagram y TikTok
    expect(hallazgo(p, 'genero-ciudad').estado).toBe('ok');
    expect(hallazgo(p, 'mismo-arroba').estado).toBe('ok');
    expect(hallazgo(p, 'escucha-fuera').estado).toBe('ok');
    expect(hallazgo(p, 'instagram-bio-palabras').estado).toBe('sin_datos'); // sin bio no se juzga
    expect(hallazgo(p, 'enlace-seguimiento').estado).toBe('mejorar');
    expect(p.auditoria.prioridades.length).toBeLessThanOrEqual(3);
    expect(p.instagram).toEqual({ leido: false, seguidores: null, clicsSemanalesEstado: 'sin_datos' });
  });

  it('el kit SEO sale con los datos de la banda y cada bio cabe en su límite', async () => {
    datos.conciertos = [{ id: 'c1', fecha: '2026-11-04', sala: 'Oktoberfest', ciudad: 'Leganés', tipo: 'publico', entradas_url: 'https://entradas.test/c1' }];
    const { kit } = (await llamar()).body;
    expect(kit.palabrasClave.map((x: any) => x.frase)).toEqual(expect.arrayContaining(['rock Madrid', 'conciertos Oktoberfest Madrid']));
    expect(kit.nombreInstagram).toBe('Ruta 66 | Rock Madrid');
    expect(kit.bios.map((b: any) => b.red)).toEqual(['instagram', 'tiktok']);
    const ig = kit.bios[0].opciones;
    expect(ig.map((o: any) => o.etiqueta)).toEqual(['Directa', 'Con el próximo bolo', 'Con vuestra frase']);
    expect(ig[1].texto).toContain('Próximo bolo: Oktoberfest, 4 nov');
    for (const b of kit.bios) for (const o of b.opciones) expect(o.caracteres).toBeLessThanOrEqual(o.limite);
  });

  it('solo se auditan las redes de la estrategia', async () => {
    fake.tablas.band_estrategia_marketing = [{ band_id: 'band-a', estrategia: { v: 1, redes: ['tiktok', 'youtube'] } }];
    const p = (await llamar()).body;
    expect(p.auditoria.especialistas.map((e: any) => e.id)).toEqual(['seo', 'tiktok', 'youtube', 'ctr']);
    expect(p.kit.nombreInstagram).toBeNull();
    expect(p.kit.bios.map((b: any) => b.red)).toEqual(['tiktok', 'youtube']);
    expect(p.enlaces.porRed.map((e: any) => e.red)).toEqual(['tiktok', 'youtube']);
  });

  it('las redes de otra banda no cambian la auditoría de esta', async () => {
    fake.tablas.band_estrategia_marketing = [{ band_id: 'band-b', estrategia: { v: 1, redes: ['youtube'] } }];
    expect((await llamar()).body.auditoria.especialistas.map((e: any) => e.id)).toEqual(['seo', 'instagram', 'tiktok', 'ctr']);
  });
});

describe('bolo y enlaces', () => {
  const bolo = (extra: Record<string, unknown> = {}) => ({ id: 'c1', fecha: '2026-11-04', sala: 'Oktoberfest', ciudad: 'Leganés', tipo: 'publico', ...extra });

  it('el bolo que cuenta es el próximo público: ni privados, ni sin confirmar, ni pasados', async () => {
    datos.conciertos = [
      bolo({ id: 'pasado', fecha: '2026-10-01' }), bolo({ id: 'privado', fecha: '2026-10-29', tipo: 'privado' }),
      bolo({ id: 'posible', fecha: '2026-10-30', is_posible: true }), bolo({ id: 'lejano', fecha: '2026-12-20' }), bolo({ id: 'c1' }),
    ];
    const p = (await llamar()).body;
    expect(hallazgo(p, 'bolo-entradas').detalle).toContain('Oktoberfest');
    expect(p.enlaces.recomendado).toMatchObject({ concertId: 'c1', destino: 'concierto' }); // sin entradas: a la página del bolo
  });

  it('con enlace de entradas, el enlace recomendado lleva directo a las entradas', async () => {
    datos.conciertos = [bolo({ entradas_url: 'https://entradas.test/c1' })];
    expect((await llamar()).body.enlaces.recomendado).toMatchObject({ destino: 'entradas', concertId: 'c1', motivo: 'Faltan 7 días para el bolo: que el clic llegue directo a las entradas.' });
    expect(destinoRecomendado({ id: 'x', dias: 30, tieneEntradas: true })).toMatchObject({ destino: 'epk', concertId: null });
    expect(destinoRecomendado(null)).toMatchObject({ destino: 'epk' });
  });

  it('por red usa el enlace del próximo bolo si existe, y cuenta los clics de 7 días', async () => {
    datos.conciertos = [bolo({ entradas_url: 'https://entradas.test/c1' })];
    datos.enlaces = [
      { code: 'viejo222', band_id: 'band-a', concert_id: 'c0', destino: 'entradas', canal: 'instagram', created_at: '2026-10-20T00:00:00Z' },
      { code: 'nuevo333', band_id: 'band-a', concert_id: 'c1', destino: 'entradas', canal: 'instagram', created_at: '2026-10-10T00:00:00Z' },
      { code: 'tiktok44', band_id: 'band-a', concert_id: null, destino: 'epk', canal: 'tiktok', created_at: '2026-10-10T00:00:00Z' },
    ];
    datos.clics = ['2026-10-27', '2026-10-27', '2026-10-26'].map((d) => ({ code: 'nuevo333', clicked_at: `${d}T12:00:00Z`, visitante: null }));
    const p = (await llamar()).body;
    const ig = p.enlaces.porRed.find((e: any) => e.red === 'instagram');
    expect(ig).toMatchObject({ url: expect.stringMatching(/\/r\/nuevo333$/), destino: 'entradas', concertId: 'c1', clics7: 3 });
    expect(p.enlaces.porRed.find((e: any) => e.red === 'tiktok')).toMatchObject({ url: expect.stringMatching(/\/r\/tiktok44$/), clics7: 0 });
    expect(hallazgo(p, 'enlace-seguimiento').estado).toBe('ok');
    expect(hallazgo(p, 'enlace-destino')).toMatchObject({ estado: 'mejorar' }); // TikTok lleva al dossier a 7 días del bolo
  });

  it('los clics de las 48 h tras publicar se cuentan por pieza', async () => {
    datos.enlaces = [{ code: 'ig222222', band_id: 'band-a', concert_id: null, destino: 'epk', canal: 'instagram', created_at: '2026-10-01T00:00:00Z' }];
    datos.clics = ['2026-10-24', '2026-10-25', '2026-10-26'].map((d) => ({ code: 'ig222222', clicked_at: `${d}T12:00:00Z`, visitante: null }));
    fake.tablas.asesor_acciones = [{ band_id: 'band-a', fecha: '2026-10-24', tarjeta_id: 'a', formato: 'reel', accion: 'hecho', titulo: 'Reel A' }];
    const { clicsTrasPublicar } = (await llamar()).body.enlaces;
    expect(clicsTrasPublicar).toEqual([{ fecha: '2026-10-24', tarjetaId: 'a', titulo: 'Reel A', formato: 'reel', total: 2, porCanal: { instagram: 2 }, completa: true }]);
  });
});

describe('Instagram conectado', () => {
  const graph = (cuerpo: unknown, ok = true) => vi.fn().mockResolvedValue({ ok, cuerpo });

  it('lee nombre, bio y seguidores, y la bio leída se audita sin pegar nada', async () => {
    datos.credenciales = { token: 'tok', igUserId: '999' };
    const pedir = graph({ name: 'Ruta 66 | Rock Madrid', biography: 'Rock desde Madrid\nPróximos bolos y entradas en el enlace', followers_count: 1000 });
    const p = (await presenciaDeLaBanda('band-a', {}, AHORA, pedir))!;
    expect(pedir.mock.calls[0][0]).toContain('/999?fields=name,biography,followers_count');
    expect(p.instagram).toMatchObject({ leido: true, seguidores: 1000 });
    for (const id of ['nombre-instagram', 'instagram-bio-longitud', 'instagram-bio-palabras', 'instagram-bio-cta']) expect(hallazgo(p, id).estado, id).toBe('ok');
  });

  it('con seguidores compara los clics semanales con la horquilla sana del temario', async () => {
    datos.credenciales = { token: 'tok', igUserId: '999' };
    datos.enlaces = [{ code: 'ig222222', band_id: 'band-a', concert_id: null, destino: 'epk', canal: 'instagram', created_at: '2026-10-01T00:00:00Z' }];
    datos.clics = Array.from({ length: 3 }, () => ({ code: 'ig222222', clicked_at: '2026-10-27T12:00:00Z', visitante: null }));
    const p = (await presenciaDeLaBanda('band-a', {}, AHORA, graph({ followers_count: 1000 })))!;
    expect(p.instagram.clicsSemanalesEstado).toBe('bajo'); // 3 de 1000 = 0,3 %, por debajo del 0,5 %
  });

  it('la bio pegada manda sobre la leída de la cuenta', async () => {
    datos.credenciales = { token: 'tok', igUserId: '999' };
    const pedir = graph({ biography: 'Somos una banda' });
    const p = (await presenciaDeLaBanda('band-a', { instagram: 'Rock desde Madrid, entradas en el enlace' }, AHORA, pedir))!;
    expect(hallazgo(p, 'instagram-bio-palabras').estado).toBe('ok');
  });

  it('si Instagram falla o no está conectado, la auditoría sale igual y pide la bio', async () => {
    datos.credenciales = { token: 'tok', igUserId: '999' };
    for (const pedir of [graph({ error: { message: 'Token caducado' } }, false), vi.fn().mockRejectedValue(new Error('red caída')), graph({ error: {} })]) {
      const p = (await presenciaDeLaBanda('band-a', {}, AHORA, pedir))!;
      expect(p.instagram.leido).toBe(false);
      expect(hallazgo(p, 'instagram-bio-palabras').estado).toBe('sin_datos');
    }
    datos.credenciales = null;
    const sinConexion = vi.fn();
    await presenciaDeLaBanda('band-a', {}, AHORA, sinConexion);
    expect(sinConexion).not.toHaveBeenCalled();
  });
});

describe('bios pegadas', () => {
  it('solo redes conocidas, texto limpio y acotado', () => {
    expect(sanearBios({ instagram: '  Rock desde Madrid\u0007  ', tiktok: 42, youtube: '', myspace: 'x', __proto__: { instagram: 'no' } })).toEqual({ instagram: 'Rock desde Madrid' });
    expect(sanearBios({ tiktok: 'x'.repeat(5000) }).tiktok).toHaveLength(1200);
    expect(sanearBios(null)).toEqual({});
    expect(sanearBios('instagram')).toEqual({});
  });

  it('una bio pegada de TikTok se audita (y la de YouTube, si están en esa red)', async () => {
    fake.tablas.band_estrategia_marketing = [{ band_id: 'band-a', estrategia: { v: 1, redes: ['tiktok', 'youtube'] } }];
    const res = await llamar({ bios: { tiktok: 'x'.repeat(81), youtube: 'Rock de Madrid. https://bandmanager.io/r/abc2345' } });
    expect(hallazgo(res.body, 'tiktok-bio-longitud')).toMatchObject({ estado: 'mejorar', detalle: 'Ocupa 81 y el límite es 80.' });
    expect(hallazgo(res.body, 'youtube-descripcion-enlace').estado).toBe('ok');
  });

  it('la ruta no escribe nada', async () => {
    await llamar({ bios: { instagram: 'hola' } });
    for (const t of Object.keys(fake.tablas)) expect(fake.tablas[t]).toHaveLength(0);
  });
});
