import { describe, it, expect } from 'vitest';
import { claveDeFestival, consultarFestivales, leadDesdeFestival, parsearFiltrosFestivales } from '../festivalesCatalogo.js';
import type { Festival } from '../seo/festivales/tipos.js';

const festival = (o: Partial<Festival> & { slug: string; nombre: string }): Festival => ({
  ciudad: 'Lugo', provincia: 'Lugo', pais: 'ES', estilos: ['rock'], web: 'https://uno.es', fuente: 'web oficial', verificadoEn: '2026-09-01',
  descripcion: { es: 'Un festival.', en: 'A festival.' }, ...o,
});

const UNO = festival({ slug: 'uno', nombre: 'Festival Uno', convocatoria: { url: 'https://uno.es/bases', cierre: '2026-12-01', resumen: { es: 'Bases', en: 'Terms' } } });
const DOS = festival({ slug: 'dos', nombre: 'Álamo Fest', ciudad: 'Sevilla', provincia: 'Sevilla', estilos: ['flamenco'], web: undefined });

describe('consultarFestivales', () => {
  it('filtra por texto sin importar tildes, por lugar y por convocatoria', () => {
    const todos = [UNO, DOS];
    expect(consultarFestivales(todos, parsearFiltrosFestivales({ texto: 'alamo' }), new Set()).map((f) => f.slug)).toEqual(['dos']);
    expect(consultarFestivales(todos, parsearFiltrosFestivales({ lugar: 'lugo' }), new Set()).map((f) => f.slug)).toEqual(['uno']);
    expect(consultarFestivales(todos, parsearFiltrosFestivales({ soloConConvocatoria: 'true' }), new Set()).map((f) => f.slug)).toEqual(['uno']);
  });
  it('los ordena por nombre y marca los que la banda ya tiene', () => {
    const fichas = consultarFestivales([UNO, DOS], parsearFiltrosFestivales({}), new Set([claveDeFestival(UNO)]));
    expect(fichas.map((f) => f.slug)).toEqual(['dos', 'uno']);
    expect(fichas.find((f) => f.slug === 'uno')?.ya_en_agenda).toBe(true);
    expect(fichas.find((f) => f.slug === 'dos')?.ya_en_agenda).toBe(false);
  });
  it('no lleva datos internos del directorio (fuente, fecha de comprobación)', () => {
    const volcado = JSON.stringify(consultarFestivales([UNO], parsearFiltrosFestivales({}), new Set()));
    expect(volcado).not.toContain('web oficial');
    expect(volcado).not.toContain('2026-09-01');
  });
});

describe('leadDesdeFestival', () => {
  it('crea un lead de tipo festival con su web y el enlace de la convocatoria', () => {
    const lead = leadDesdeFestival(UNO, 'lead-1', 'banda-1');
    expect(lead).toMatchObject({ id: 'lead-1', band_id: 'banda-1', nombre_sala: 'Festival Uno', ciudad: 'Lugo', region: 'Lugo', tipo: 'festival', website: 'https://uno.es', estado: 'nuevo', email_contacto: '' });
    expect(String(lead.notas)).toContain('https://uno.es/bases');
    expect(String(lead.notas)).toContain('2026-12-01');
  });
  it('sin web ni convocatoria no inventa nada', () => {
    const lead = leadDesdeFestival(DOS, 'lead-2', 'banda-1');
    expect(lead.website).toBeUndefined();
    expect(lead.notas).toBeUndefined();
  });
});
