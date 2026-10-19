import { describe, it, expect } from 'vitest';
import { salaDesdeOsm, salasDeOsm, type ElementoOsm } from '../osmSalas.js';
import { regionDeCodigoPostal } from '../regionesEspana.js';

const el = (tags: Record<string, string>, id = 1): ElementoOsm => ({ type: 'node', id, tags });

describe('regionDeCodigoPostal', () => {
  it('saca la comunidad de las dos primeras cifras', () => {
    expect(regionDeCodigoPostal('28004')).toBe('Comunidad de Madrid');
    expect(regionDeCodigoPostal('48001')).toBe('País Vasco');
    expect(regionDeCodigoPostal('36201')).toBe('Galicia');
  });
  it('lo que no es un código postal español no tiene región', () => {
    expect(regionDeCodigoPostal('99999')).toBeNull();
    expect(regionDeCodigoPostal('1234')).toBeNull();
    expect(regionDeCodigoPostal(undefined)).toBeNull();
  });
});

describe('salaDesdeOsm', () => {
  const base = { amenity: 'music_venue', name: 'Sala Moby Dick', 'addr:city': 'Madrid', 'addr:street': 'Calle Mayor', 'addr:housenumber': '5', 'addr:postcode': '28004' };

  it('recoge los campos públicos de la sala', () => {
    const s = salaDesdeOsm(el({ ...base, capacity: '350', website: 'https://salamoby.es/', email: 'info@salamoby.es', phone: '+34 910 123 456', 'contact:instagram': 'https://instagram.com/salamoby' }));
    expect(s).toMatchObject({ nombre: 'Sala Moby Dick', ciudad: 'Madrid', region: 'Comunidad de Madrid', tipo: 'sala', aforo: 350, email_contacto: 'info@salamoby.es', telefono: '910123456' });
    expect(s?.direccion).toBe('Calle Mayor 5, 28004');
    expect(s?.clave).toBe('nc:sala moby dick|madrid');
    expect(s?.place_id).toBeNull();
  });

  it('una discoteca es tipo discoteca', () => {
    expect(salaDesdeOsm(el({ ...base, amenity: 'nightclub' }))?.tipo).toBe('discoteca');
  });

  it('descarta lo privado: email personal, móvil e Instagram que no es de la sala', () => {
    const s = salaDesdeOsm(el({ ...base, email: 'juan.perez@gmail.com', phone: '+34 600 111 222', instagram: 'otra_persona' }));
    expect(s).toMatchObject({ email_contacto: null, telefono: null, instagram: null });
  });

  it('de varios teléfonos o emails separados por «;» coge el primero válido', () => {
    const s = salaDesdeOsm(el({ ...base, phone: '600111222;910123456', email: 'x@gmail.com;booking@salamoby.es' }));
    expect(s).toMatchObject({ telefono: '910123456', email_contacto: 'booking@salamoby.es' });
  });

  it('sin nombre o sin ciudad no se puede identificar: no entra', () => {
    expect(salaDesdeOsm(el({ amenity: 'music_venue', 'addr:city': 'Madrid' }))).toBeNull();
    expect(salaDesdeOsm(el({ amenity: 'music_venue', name: 'Sala X' }))).toBeNull();
  });

  it('un aforo absurdo se ignora', () => {
    expect(salaDesdeOsm(el({ ...base, capacity: '9999999' }))?.aforo).toBeNull();
    expect(salaDesdeOsm(el({ ...base, capacity: 'unos 300' }))?.aforo).toBe(300);
  });
});

describe('salasDeOsm', () => {
  it('el mismo local mapeado dos veces se fusiona y se completan los huecos', () => {
    const r = salasDeOsm([
      el({ amenity: 'music_venue', name: 'La Riviera', 'addr:city': 'Madrid', capacity: '2000' }, 1),
      { type: 'way', id: 2, tags: { amenity: 'music_venue', name: 'La Riviera', 'addr:city': 'Madrid', website: 'https://larivieramadrid.com/' } },
    ]);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ aforo: 2000, website: 'https://larivieramadrid.com/' });
  });
});
