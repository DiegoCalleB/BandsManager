import { describe, it, expect } from 'vitest';
import { regionDeBandflow, salaDesdeBandflow, salasDeBandflow, type FichaBandflow } from '../bandflowSalas.js';

const ficha = (sala: NonNullable<FichaBandflow['sala']>, extra: Partial<FichaBandflow> = {}): FichaBandflow => ({ url: 'https://bandflow.es/sala/x/', sala, ...extra });
const base = { name: 'Sala Moby Dick', address: { addressLocality: 'Madrid', streetAddress: ' Calle Mayor 5', postalCode: '28004', addressRegion: 'Madrid' } };

describe('regionDeBandflow', () => {
  it('normaliza la comunidad que declara la ficha', () => {
    expect(regionDeBandflow('Madrid', undefined)).toBe('Comunidad de Madrid');
    expect(regionDeBandflow('Cataluña', undefined)).toBe('Cataluña');
    expect(regionDeBandflow('Illes Balears', undefined)).toBe('Islas Baleares');
  });
  it('sin comunidad conocida usa el código postal', () => {
    expect(regionDeBandflow(undefined, '48001')).toBe('País Vasco');
    expect(regionDeBandflow('Narnia', '36201')).toBe('Galicia');
  });
  it('sin nada, null', () => expect(regionDeBandflow(undefined, undefined)).toBeNull());
});

describe('salaDesdeBandflow', () => {
  it('recoge los hechos de la sala', () => {
    const s = salaDesdeBandflow(ficha({ ...base, maximumAttendeeCapacity: 350, email: 'info@salamoby.es', telephone: ' 910 123 456', sameAs: ['https://www.salamoby.es/'] }));
    expect(s).toMatchObject({ nombre: 'Sala Moby Dick', ciudad: 'Madrid', region: 'Comunidad de Madrid', aforo: 350, email_contacto: 'info@salamoby.es', telefono: '910123456', website: 'https://www.salamoby.es/', tipo: 'sala' });
    expect(s?.direccion).toBe('Calle Mayor 5, 28004');
    expect(s?.clave).toBe('nc:sala moby dick|madrid');
  });

  it('descarta lo privado: email personal o de un nombre propio, móvil e Instagram que no es de la sala', () => {
    const s = salaDesdeBandflow(ficha({ ...base, email: 'juan.perez@gmail.com', telephone: '679 957 956' }, { instagram: ['https://instagram.com/otra_persona'], mail: ['maria@salamoby.es'] }));
    expect(s).toMatchObject({ email_contacto: null, telefono: null, instagram: null });
  });

  it('coge el Instagram de la sala aunque venga entre los enlaces, y no lo confunde con la web', () => {
    const s = salaDesdeBandflow(ficha({ ...base, sameAs: ['https://www.instagram.com/salamoby/', 'https://salamoby.es/'] }));
    expect(s?.instagram).toBe('salamoby');
    expect(s?.website).toBe('https://salamoby.es/');
  });

  it('no usa un PDF de rider como web de la sala', () => {
    const s = salaDesdeBandflow(ficha(base, { web: ['https://sala.es/rider.pdf'] }));
    expect(s?.website).toBeNull();
  });

  it('sin nombre o sin ciudad no se puede identificar', () => {
    expect(salaDesdeBandflow(ficha({ address: { addressLocality: 'Madrid' } }))).toBeNull();
    expect(salaDesdeBandflow(ficha({ name: 'Sala X' }))).toBeNull();
    expect(salaDesdeBandflow({ url: 'x', sala: null })).toBeNull();
  });

  it('un aforo absurdo se ignora', () => {
    expect(salaDesdeBandflow(ficha({ ...base, maximumAttendeeCapacity: 9_999_999 }))?.aforo).toBeNull();
  });
});

describe('salasDeBandflow', () => {
  it('una sala repetida cuenta una vez', () => {
    expect(salasDeBandflow([ficha(base), ficha(base)])).toHaveLength(1);
  });
});
