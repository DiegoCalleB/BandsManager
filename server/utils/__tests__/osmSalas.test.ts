import { describe, it, expect } from 'vitest';
import { consultaOverpassSalas, consultaOverpassSoloSalas, contarDescartes, REGIONES_OSM, salaDesdeOsm, salasDeOsm, type ElementoOsm } from '../osmSalas.js';
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
  it('pide salas de música en directo y locales de conciertos; discotecas, teatros, bares, pubs y cafés solo si declaran música en directo; nunca restaurantes', () => {
    expect(q).toContain('"amenity"="music_venue"');
    expect(q).toContain('"amenity"="concert_hall"');
    expect(q).toContain('"amenity"~"^(nightclub|theatre|arts_centre)$"]["live_music"="yes"');
    expect(q).toContain('"amenity"~"^(bar|pub|cafe)$"]["live_music"="yes"');
    expect(q).not.toMatch(/"amenity"="(bar|pub|cafe)"/);
    expect(q).not.toContain('restaurant');
  });

  it('un bar, pub o café con música en directo entra como «bar»', () => {
    for (const amenity of ['bar', 'pub', 'cafe']) {
      expect(salaDesdeOsm({ type: 'node', id: 1, tags: { amenity, live_music: 'yes', name: 'El Sótano', 'addr:city': 'Madrid' } })?.tipo).toBe('bar');
    }
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


describe('conCiudadResuelta', () => {
  const nucleo = (name: string, lat: number, lon: number, place = 'town'): ElementoOsm => ({ type: 'node', id: Math.round(lat * 1000), lat, lon, tags: { place, name } });
  const sala = (name: string, lat: number, lon: number, extra: Record<string, string> = {}): ElementoOsm => ({ type: 'node', id: Math.round(lon * 1000), lat, lon, tags: { amenity: 'music_venue', name, ...extra } });

  it('le pone a una sala sin ciudad el núcleo de población más cercano', async () => {
    const { conCiudadResuelta, salasDeOsm } = await import('../osmSalas.js');
    const { salas, porCercania } = conCiudadResuelta([nucleo('Lugo', 43.01, -7.55, 'city'), nucleo('Monforte', 42.52, -7.51), sala('Sala Vella', 43.0, -7.56)]);
    expect(porCercania).toBe(1);
    expect(salasDeOsm(salas)[0]).toMatchObject({ nombre: 'Sala Vella', ciudad: 'Lugo' });
  });

  it('los núcleos de población no se cuelan como salas', async () => {
    const { conCiudadResuelta } = await import('../osmSalas.js');
    const { salas } = conCiudadResuelta([nucleo('Lugo', 43.01, -7.55, 'city'), sala('Sala Vella', 43.0, -7.56)]);
    expect(salas).toHaveLength(1);
    expect(salas[0].tags?.name).toBe('Sala Vella');
  });

  it('respeta la ciudad que OSM ya trae', async () => {
    const { conCiudadResuelta } = await import('../osmSalas.js');
    const { salas, porCercania } = conCiudadResuelta([nucleo('Lugo', 43.01, -7.55, 'city'), sala('Sala Vella', 43.0, -7.56, { 'addr:city': 'Outeiro' })]);
    expect(porCercania).toBe(0);
    expect(salas[0].tags?.['addr:city']).toBe('Outeiro');
  });

  it('si el núcleo está a más de 12 km, no inventa la ciudad', async () => {
    const { conCiudadResuelta } = await import('../osmSalas.js');
    const { salas, porCercania } = conCiudadResuelta([nucleo('Lugo', 43.01, -7.55, 'city'), sala('Sala Lejana', 42.0, -7.0)]);
    expect(porCercania).toBe(0);
    expect(salas[0].tags?.['addr:city']).toBeUndefined();
  });

  it('usa el punto central de una vía o relación', async () => {
    const { conCiudadResuelta } = await import('../osmSalas.js');
    const via: ElementoOsm = { type: 'way', id: 9, center: { lat: 43.0, lon: -7.56 }, tags: { amenity: 'concert_hall', name: 'Auditorio' } };
    expect(conCiudadResuelta([nucleo('Lugo', 43.01, -7.55, 'city'), via]).salas[0].tags?.['addr:city']).toBe('Lugo');
  });

  it('sin coordenadas no puede resolver nada y la deja como estaba', async () => {
    const { conCiudadResuelta } = await import('../osmSalas.js');
    const sinPunto: ElementoOsm = { type: 'node', id: 1, tags: { amenity: 'music_venue', name: 'Sin punto' } };
    expect(conCiudadResuelta([nucleo('Lugo', 43.01, -7.55, 'city'), sinPunto]).porCercania).toBe(0);
  });

  it('la consulta pide también los núcleos de población', async () => {
    const { consultaOverpassSalas } = await import('../osmSalas.js');
    const q = consultaOverpassSalas('ES-GA');
    expect(q).toContain('"place"~"^(city|town|village)$"');
    expect(q.match(/out tags center;/g)).toHaveLength(2);
  });
});

describe('consultaOverpassSoloSalas', () => {
  it('pide las mismas salas sin los núcleos de población y con su región saneada', () => {
    const q = consultaOverpassSoloSalas('ES-GA');
    expect(q).toContain('"ISO3166-2"="ES-GA"');
    expect(q).toContain('"amenity"="music_venue"');
    expect(q).not.toContain('place');
    expect(q.match(/out tags center;/g)).toHaveLength(1);
    expect(consultaOverpassSoloSalas('ES-GA"; out;')).not.toContain('out;"');
  });
});

describe('salaDesdeOsm: recintos masivos', () => {
  it('no recoge un pabellón de estadio', () => {
    expect(salaDesdeOsm({ type: 'node', id: 1, tags: { amenity: 'concert_hall', name: 'Movistar Arena', 'addr:city': 'Madrid', capacity: '17000' } })).toBeNull();
    expect(salaDesdeOsm({ type: 'node', id: 2, tags: { amenity: 'concert_hall', name: 'Sala Pequeña', 'addr:city': 'Madrid', capacity: '300' } })).not.toBeNull();
  });
});
