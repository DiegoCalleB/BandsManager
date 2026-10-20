import { describe, it, expect } from 'vitest';
import { consultaOverpassCiudad, consultaOverpassSalas, contarDescartes, REGIONES_OSM, salaDesdeOsm, salasDeOsm, type ElementoOsm } from '../osmSalas.js';
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

describe('consultaOverpassSalas', () => {
  const q = consultaOverpassSalas('ES-MD');
  it('pide salas de música en directo y locales de conciertos; discotecas y teatros solo si declaran música en directo, nunca bares, cafés ni restaurantes', () => {
    expect(q).toContain('"amenity"="music_venue"');
    expect(q).toContain('"amenity"="concert_hall"');
    expect(q).toContain('"amenity"~"^(nightclub|theatre|arts_centre)$"]["live_music"="yes"');
    expect(q).not.toMatch(/"(bar|pub|cafe|restaurant)"|\|(bar|pub|cafe|restaurant)\|/);
  });
  it('la consulta de una ciudad busca dentro de su término municipal y neutraliza el nombre', () => {
    const c = consultaOverpassCiudad('Madrid');
    expect(c).toContain('"admin_level"="8"]["name"="Madrid"');
    expect(consultaOverpassCiudad('Madrid"]; out;')).not.toContain('out;"');
  });
  it('limita la consulta a una comunidad por su código ISO y neutraliza cualquier otro texto', () => {
    expect(q).toContain('"ISO3166-2"="ES-MD"');
    expect(consultaOverpassSalas('ES-MD"; out;')).not.toContain('out;"');
    expect(REGIONES_OSM.every((r) => consultaOverpassSalas(r).includes(`"${r}"`))).toBe(true);
  });
});

describe('contarDescartes', () => {
  it('cuenta los elementos sin nombre y los que tienen nombre pero no ciudad, y no los que entran', () => {
    const r = contarDescartes([
      el({ amenity: 'music_venue' }, 1),
      el({ amenity: 'music_venue', name: 'Sala Sin Ciudad' }, 2),
      el({ amenity: 'music_venue', name: 'Sala Con Ciudad', 'addr:city': 'Soria' }, 3),
      el({ amenity: 'concert_hall', name: 'Otra Sin Ciudad' }, 4),
    ]);
    expect(r).toEqual({ sinNombre: 1, sinCiudad: 2 });
  });
});

