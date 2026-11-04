import { describe, expect, it } from 'vitest';
import { candidatosAnuncio, DIAS_ANUNCIO, MAX_CANDIDATOS, PRESUPUESTO_DIA, type DatosAnuncios } from '../anuncios';
import type { ResultadoRed } from '../metricasPorRed';
import type { ResultadoPieza } from '../resumen';

const HOY = '2026-10-28';
const ig = (fecha: string, tarjetaId: string, alcance: number, guardados: number, noSeg: number | null, formato: ResultadoPieza['formato'] = 'reel'): ResultadoPieza =>
  ({ fecha, tarjetaId, formato, titulo: `Idea ${tarjetaId}`, alcance, guardados, alcanceNoSeguidores: noSeg });
const rr = (fecha: string, tarjetaId: string, red: ResultadoRed['red'], visualizaciones: number): ResultadoRed =>
  ({ fecha, tarjetaId, red, formato: 'reel', titulo: `Idea ${tarjetaId}`, metricas: { visualizaciones } });
const datos = (extra: Partial<DatosAnuncios> = {}): DatosAnuncios => ({
  hoy: HOY, resultados: [], resultadosRed: [], proximoBolo: null, ciudad: 'Madrid, España', genero: 'Rock / Blues', referentes: ['Los Suaves', 'Leño'], ...extra,
});
// 1000 alcanzadas: 4 % guardan. Con 100 de fuera (10 %) no sale de casa; con 500 (50 %), sí.
const DESCUBRIMIENTO = (id: string, f = '2026-10-25') => ig(f, id, 1000, 40, 100);
const FUNCIONA = (id: string, f = '2026-10-25') => ig(f, id, 1000, 40, 500);
const VALOR = (id: string, f = '2026-10-25') => ig(f, id, 1000, 5, 500);
const TODO = (id: string, f = '2026-10-25') => ig(f, id, 1000, 5, 50);

describe('qué merece dinero (Instagram, con los umbrales del temario)', () => {
  const decision = (r: ResultadoPieza) => candidatosAnuncio(datos({ resultados: [r] }))[0];

  it('lo que a los vuestros les encanta pero no sale de casa: pagar alcance es justo lo que le falta', () => {
    const c = decision(DESCUBRIMIENTO('a'));
    expect(c).toMatchObject({ decision: 'impulsar', red: 'instagram', tarjetaId: 'a' });
    expect(c.motivo).toContain('lo que le falta es alcance');
    expect(c.plan).not.toBeNull();
  });
  it('lo que ya funciona también se impulsa', () => {
    expect(decision(FUNCIONA('a'))).toMatchObject({ decision: 'impulsar' });
  });
  it('llega lejos pero no se guarda, o ni llega ni se guarda: NO se gasta, y se dice por qué', () => {
    expect(decision(VALOR('a'))).toMatchObject({ decision: 'no_gastar', plan: null });
    expect(decision(VALOR('a')).motivo).toContain('más gente que pasa de largo');
    expect(decision(TODO('a'))).toMatchObject({ decision: 'no_gastar', plan: null });
  });
  it('con poco alcance, espera: no hay datos para decidir', () => {
    expect(decision(ig('2026-10-25', 'a', 50, 5, 5))).toMatchObject({ decision: 'esperar', plan: null });
  });
});

describe('orden, ventana y límites', () => {
  it('lo que más gana con dinero va primero: sin salir de casa, luego lo que funciona, luego esperar y por último no gastar', () => {
    const r = [TODO('todo'), FUNCIONA('funciona'), VALOR('valor'), DESCUBRIMIENTO('descubre'), ig('2026-10-25', 'poco', 50, 5, 5)];
    expect(candidatosAnuncio(datos({ resultados: r })).map((c) => c.tarjetaId)).toEqual(['descubre', 'funciona', 'poco', 'valor']);
  });
  it('solo los últimos 14 días, nunca las stories y como mucho cuatro', () => {
    const r = [DESCUBRIMIENTO('vieja', '2026-09-01'), ig('2026-10-25', 'story', 1000, 40, 100, 'stories'), ...['a', 'b', 'c', 'd', 'e', 'f'].map((id, i) => DESCUBRIMIENTO(id, `2026-10-2${i}`))];
    const ids = candidatosAnuncio(datos({ resultados: r })).map((c) => c.tarjetaId);
    expect(ids).toHaveLength(MAX_CANDIDATOS);
    expect(ids).not.toContain('vieja');
    expect(ids).not.toContain('story');
  });
  it('a igual decisión, lo más reciente primero; sin resultados no inventa nada', () => {
    expect(candidatosAnuncio(datos({ resultados: [DESCUBRIMIENTO('a', '2026-10-20'), DESCUBRIMIENTO('b', '2026-10-26')] })).map((c) => c.tarjetaId)).toEqual(['b', 'a']);
    expect(candidatosAnuncio(datos())).toEqual([]);
  });
});

describe('el plan: objetivo, zona, dinero y público', () => {
  const plan = (extra: Partial<DatosAnuncios>) => candidatosAnuncio(datos({ resultados: [DESCUBRIMIENTO('a')], ...extra }))[0].plan!;
  const bolo = (dias: number, tieneEntradas = true) => ({ sala: 'Oktoberfest', ciudad: 'Leganés', dias, tieneEntradas });

  it('sin bolo cerca: alcance en la ciudad de la banda y su entorno, con un presupuesto pequeño', () => {
    expect(plan({})).toMatchObject({ objetivo: 'alcance', zona: 'Madrid y unos 50 km alrededor', presupuestoDia: PRESUPUESTO_DIA, dias: DIAS_ANUNCIO, total: PRESUPUESTO_DIA * DIAS_ANUNCIO });
  });
  it('con un bolo cerca y entradas: visitas al enlace, en la ciudad del bolo, y acaba antes de que sea', () => {
    const p = plan({ proximoBolo: bolo(10) });
    expect(p).toMatchObject({ objetivo: 'entradas', zona: 'Leganés y unos 30 km alrededor', dias: 5 });
    expect(p.pasos.some((x) => x.includes('lleva a las entradas del bolo'))).toBe(true);
    expect(plan({ proximoBolo: bolo(4) }).dias).toBe(3); // el anuncio acaba un día antes
    expect(plan({ proximoBolo: bolo(2) }).dias).toBe(2); // nunca menos de dos días
  });
  it('un bolo sin entradas, o lejano, no cambia el objetivo: no hay a dónde llevar el clic', () => {
    expect(plan({ proximoBolo: bolo(7, false) }).objetivo).toBe('alcance');
    expect(plan({ proximoBolo: bolo(40) }).objetivo).toBe('alcance');
  });
  it('el público sale del género y de los referentes (hasta tres), y los pasos dicen cuánto y cuánto tiempo', () => {
    const p = plan({ referentes: ['A', 'B', 'C', 'D'] });
    expect(p.publico).toBe('Gente de la zona: quienes escuchan rock y fans de A, B, C.');
    expect(p.pasos).toContain(`Presupuesto: ${PRESUPUESTO_DIA} € al día durante ${DIAS_ANUNCIO} días (${PRESUPUESTO_DIA * DIAS_ANUNCIO} € en total).`);
    expect(p.pasos[0]).toBe('Abrid la publicación en vuestro perfil y pulsad «Promocionar».');
    expect(p.pasos.at(-1)).toContain('parad si no se mueven');
    expect(plan({ genero: '', ciudad: '', referentes: [] })).toMatchObject({ zona: 'Vuestra ciudad y alrededores', publico: 'Gente de la zona interesada en música en directo.' });
  });
});

describe('TikTok y YouTube: sin umbrales de temario, frente a lo habitual de la propia banda', () => {
  const previas = (red: ResultadoRed['red']) => [rr('2026-10-10', 'p1', red, 1000), rr('2026-10-12', 'p2', red, 2000), rr('2026-10-14', 'p3', red, 3000)];
  const con = (red: ResultadoRed['red'], vistas: number) => candidatosAnuncio(datos({ resultadosRed: [...previas(red), rr('2026-10-26', 'nueva', red, vistas)] })).find((c) => c.tarjetaId === 'nueva')!;

  it('TikTok por encima de lo habitual: impulsar, con su botón', () => {
    const c = con('tiktok', 6000);
    expect(c).toMatchObject({ decision: 'impulsar', red: 'tiktok' });
    expect(c.motivo).toContain('3,0× la mediana');
    expect(c.plan!.pasos[0]).toBe('Abrid el vídeo en vuestro perfil y pulsad «Promocionar».');
  });
  it('por debajo no se paga, y en su línea o sin con qué comparar, se espera', () => {
    expect(con('tiktok', 1000)).toMatchObject({ decision: 'no_gastar', plan: null });
    expect(con('tiktok', 2200)).toMatchObject({ decision: 'esperar' });
    expect(candidatosAnuncio(datos({ resultadosRed: [rr('2026-10-26', 'sola', 'tiktok', 6000)] }))[0]).toMatchObject({ decision: 'esperar' });
  });
  it('YouTube se promociona desde Google Ads: se dice, sin inventar un plan', () => {
    const c = con('youtube', 6000);
    expect(c).toMatchObject({ decision: 'impulsar', plan: null });
    expect(c.motivo).toContain('Google Ads');
  });
});
