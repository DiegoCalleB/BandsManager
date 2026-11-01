import { describe, expect, it } from 'vitest';
import { auditar, ETIQUETA_ORIGEN, handleDe, MAX_PRIORIDADES, type DatosAuditoria, type Hallazgo } from '../auditoria';

const base = (extra: Partial<DatosAuditoria> = {}): DatosAuditoria => ({
  hoy: '2026-10-28', nombre: 'Ruta 66', genero: 'Rock', ciudad: 'Madrid', redes: ['instagram', 'tiktok'],
  perfiles: { instagram: { url: 'https://instagram.com/ruta66' }, tiktok: { url: 'https://www.tiktok.com/@ruta66' } },
  spotify: 'https://open.spotify.com/artist/x', biografiaEpk: 'Ruta 66 es una banda de rock de Madrid con tres años de directos en salas pequeñas.',
  logo: true, fotos: 5, emailBooking: true, proximoBolo: null, enlaces: {}, ...extra,
});
const hallazgo = (d: DatosAuditoria, id: string): Hallazgo => auditar(d).especialistas.flatMap((e) => e.hallazgos).find((h) => h.id === id)!;
const MAL = base({ genero: '', ciudad: '', spotify: undefined, biografiaEpk: '', logo: false, fotos: 1, emailBooking: false, perfiles: {} });

describe('handleDe', () => {
  it('saca el @ de cada red, o null si no se puede', () => {
    expect(handleDe('https://www.instagram.com/Ruta66/')).toBe('ruta66');
    expect(handleDe('https://tiktok.com/@Ruta66?lang=es')).toBe('ruta66');
    expect(handleDe('https://www.youtube.com/@Ruta66Band')).toBe('ruta66band');
    expect(handleDe('https://facebook.com/ruta66')).toBe('ruta66');
    expect(handleDe('https://www.youtube.com/channel/UCabc123')).toBeNull(); // un id no es un nombre
    expect(handleDe('instagram.com/ruta66')).toBe('ruta66');
    expect(handleDe('https://miweb.com/ruta66')).toBeNull();
    expect(handleDe(undefined)).toBeNull();
    expect(handleDe('no es una url')).toBeNull();
  });
});

describe('auditar: SEO', () => {
  it('género y ciudad definidos es lo primero que se pide', () => {
    expect(hallazgo(base(), 'genero-ciudad').estado).toBe('ok');
    const mal = hallazgo(MAL, 'genero-ciudad');
    expect(mal).toMatchObject({ estado: 'mejorar', impacto: 3 });
    expect(mal.detalle).toBe('Falta el género y la ciudad en el perfil de la banda.');
  });

  it('mismo @: ok si coincide, mejorar si no, sin datos si no hay con qué comparar', () => {
    expect(hallazgo(base(), 'mismo-arroba').estado).toBe('ok');
    expect(hallazgo(base({ perfiles: { instagram: { url: 'https://instagram.com/ruta66' }, tiktok: { url: 'https://tiktok.com/@ruta66band' } } }), 'mismo-arroba')).toMatchObject({ estado: 'mejorar' });
    expect(hallazgo(base({ perfiles: { instagram: { url: 'https://instagram.com/ruta66' } } }), 'mismo-arroba').estado).toBe('sin_datos');
  });

  it('el nombre de Instagram: sin datos si no se ha podido leer, y mejora si no dice género ni ciudad', () => {
    expect(hallazgo(base(), 'nombre-instagram').estado).toBe('sin_datos');
    expect(hallazgo(base({ nombreInstagram: 'Ruta 66' }), 'nombre-instagram')).toMatchObject({ estado: 'mejorar' });
    expect(hallazgo(base({ nombreInstagram: 'Ruta 66 | Rock Madrid' }), 'nombre-instagram').estado).toBe('ok');
    expect(auditar(base({ redes: ['tiktok'] })).especialistas[0].hallazgos.map((h) => h.id)).not.toContain('nombre-instagram');
  });

  it('Spotify y la biografía del dossier', () => {
    expect(hallazgo(MAL, 'escucha-fuera').estado).toBe('mejorar');
    expect(hallazgo(MAL, 'bio-dossier').estado).toBe('mejorar');
    expect(hallazgo(base({ biografiaEpk: 'Somos una banda con muchas ganas.' }), 'bio-dossier')).toMatchObject({ estado: 'mejorar', detalle: 'La biografía no dice género y ciudad.' });
    expect(hallazgo(base(), 'bio-dossier').estado).toBe('ok');
  });
});

describe('auditar: bios de cada red', () => {
  const conBio = (red: 'instagram' | 'tiktok', bio: string) => base({ perfiles: { instagram: { url: 'https://instagram.com/ruta66', bio: red === 'instagram' ? bio : undefined }, tiktok: { url: 'https://tiktok.com/@ruta66', bio: red === 'tiktok' ? bio : undefined } } });

  it('sin bio no se juzga: se pide, nunca se da por buena ni por mala', () => {
    for (const id of ['instagram-bio-longitud', 'instagram-bio-palabras', 'instagram-bio-cta', 'tiktok-bio-longitud', 'tiktok-bio-palabras']) {
      const h = hallazgo(base(), id);
      expect(h.estado, id).toBe('sin_datos');
      expect(h.arreglo).toContain('Pega tus bios');
    }
  });

  it('Instagram: 150 caracteres, género y ciudad, y una llamada a la acción', () => {
    const buena = 'Rock desde Madrid\nPróximos bolos y entradas en el enlace';
    for (const id of ['instagram-bio-longitud', 'instagram-bio-palabras', 'instagram-bio-cta']) expect(hallazgo(conBio('instagram', buena), id).estado, id).toBe('ok');
    expect(hallazgo(conBio('instagram', 'x'.repeat(151)), 'instagram-bio-longitud')).toMatchObject({ estado: 'mejorar', detalle: 'Ocupa 151 y el límite es 150.' });
    expect(hallazgo(conBio('instagram', 'Somos Ruta 66'), 'instagram-bio-palabras')).toMatchObject({ estado: 'mejorar', detalle: 'No dice el género ni la ciudad.' });
    expect(hallazgo(conBio('instagram', 'Rock de Madrid'), 'instagram-bio-palabras').estado).toBe('ok');
    expect(hallazgo(conBio('instagram', 'Rock de Madrid'), 'instagram-bio-cta').estado).toBe('mejorar');
  });

  it('TikTok tiene un límite más corto (80) y es el mismo criterio de palabras clave', () => {
    expect(hallazgo(conBio('tiktok', 'x'.repeat(81)), 'tiktok-bio-longitud').estado).toBe('mejorar');
    expect(hallazgo(conBio('tiktok', 'x'.repeat(80)), 'tiktok-bio-longitud').estado).toBe('ok');
    expect(hallazgo(conBio('tiktok', 'ROCK desde MADRID'), 'tiktok-bio-palabras').estado).toBe('ok'); // sin mirar mayúsculas
    expect(hallazgo(conBio('tiktok', 'Música en directo, Madríd'), 'tiktok-bio-palabras').detalle).toBe('No dice el género.');
  });

  it('comparar sin tildes: «Música» y «musica» cuentan igual', () => {
    expect(hallazgo(base({ genero: 'Música urbana', perfiles: { instagram: { url: 'x', bio: 'musica urbana de Madrid' } } }), 'instagram-bio-palabras').estado).toBe('ok');
  });

  it('la descripción del canal de YouTube debe llevar un enlace', () => {
    const yt = (desc?: string) => base({ redes: ['youtube'], perfiles: { youtube: { url: 'https://youtube.com/@ruta66', bio: desc } } });
    expect(hallazgo(yt(), 'youtube-descripcion-enlace').estado).toBe('sin_datos');
    expect(hallazgo(yt('Rock de Madrid'), 'youtube-descripcion-enlace').estado).toBe('mejorar');
    expect(hallazgo(yt('Rock de Madrid. Entradas: https://bandmanager.io/r/abc2345'), 'youtube-descripcion-enlace').estado).toBe('ok');
  });
});

describe('auditar: CTR y conversión', () => {
  const bolo = (dias: number, tieneEntradas = true) => ({ id: 'c1', fecha: '2026-11-04', sala: 'Oktoberfest', dias, tieneEntradas });

  it('pide un enlace con seguimiento por red', () => {
    expect(hallazgo(base(), 'enlace-seguimiento')).toMatchObject({ estado: 'mejorar', detalle: 'Sin enlace con seguimiento en instagram, tiktok.' });
    expect(hallazgo(base({ enlaces: { instagram: { destino: 'epk', concertId: null }, tiktok: { destino: 'epk', concertId: null } } }), 'enlace-seguimiento').estado).toBe('ok');
  });

  it('con un bolo cerca, el enlace tiene que llevar a ESE bolo; lejos, vale el dossier', () => {
    const enlaces = (destino: 'entradas' | 'epk', concertId: string | null) => ({ instagram: { destino, concertId }, tiktok: { destino, concertId } });
    expect(hallazgo(base({ proximoBolo: bolo(7), enlaces: enlaces('epk', null) }), 'enlace-destino')).toMatchObject({ estado: 'mejorar' });
    expect(hallazgo(base({ proximoBolo: bolo(7), enlaces: enlaces('entradas', 'c-viejo') }), 'enlace-destino').estado).toBe('mejorar'); // apunta a otro bolo
    expect(hallazgo(base({ proximoBolo: bolo(7), enlaces: enlaces('entradas', 'c1') }), 'enlace-destino').estado).toBe('ok');
    expect(hallazgo(base({ proximoBolo: bolo(40), enlaces: enlaces('epk', null) }), 'enlace-destino').estado).toBe('ok');
    expect(hallazgo(base({ proximoBolo: bolo(7) }), 'enlace-destino').estado).toBe('sin_datos'); // sin enlaces no hay qué revisar
  });

  it('un bolo sin entradas enlazadas es lo más caro de no arreglar', () => {
    expect(hallazgo(base({ proximoBolo: bolo(7, false) }), 'bolo-entradas')).toMatchObject({ estado: 'mejorar', impacto: 3 });
    expect(hallazgo(base({ proximoBolo: bolo(7, true) }), 'bolo-entradas').estado).toBe('ok');
    expect(auditar(base()).especialistas.flatMap((e) => e.hallazgos).map((h) => h.id)).not.toContain('bolo-entradas'); // sin bolo no aplica
  });

  it('logo, fotos y contacto de booking', () => {
    expect(hallazgo(MAL, 'identidad-visual')).toMatchObject({ estado: 'mejorar', detalle: 'Falta el logo. Hay 1 fotos (faltan para variar portadas y stories).' });
    expect(hallazgo(base({ fotos: 2 }), 'identidad-visual').estado).toBe('mejorar');
    expect(hallazgo(base(), 'identidad-visual').estado).toBe('ok');
    expect(hallazgo(MAL, 'contacto-booking').estado).toBe('mejorar');
  });
});

describe('auditar: el equipo', () => {
  it('solo audita las redes en las que está la banda', () => {
    expect(auditar(base({ redes: ['instagram'] })).especialistas.map((e) => e.id)).toEqual(['seo', 'instagram', 'ctr']);
    expect(auditar(base({ redes: ['tiktok', 'youtube'] })).especialistas.map((e) => e.id)).toEqual(['seo', 'tiktok', 'youtube', 'ctr']);
  });

  it('las prioridades son tres como mucho, de más a menos impacto y, a igual impacto, lo más rápido', () => {
    const { prioridades } = auditar(MAL);
    expect(prioridades).toHaveLength(MAX_PRIORIDADES);
    expect(prioridades.every((p) => p.estado === 'mejorar')).toBe(true);
    for (let i = 1; i < prioridades.length; i++) {
      const a = prioridades[i - 1], b = prioridades[i];
      expect(a.impacto > b.impacto || (a.impacto === b.impacto && a.esfuerzoMin <= b.esfuerzoMin)).toBe(true);
    }
    expect(prioridades[0].impacto).toBe(3);
  });

  it('los recuentos cuadran y lo que está bien no genera prioridades', () => {
    const a = auditar(base());
    const todos = a.especialistas.flatMap((e) => e.hallazgos);
    expect(a.resumen.ok + a.resumen.mejorar + a.resumen.sinDatos).toBe(todos.length);
    expect(a.resumen.ok).toBe(todos.filter((h) => h.estado === 'ok').length);
    expect(a.prioridades.every((p) => p.estado !== 'ok' && p.estado !== 'sin_datos')).toBe(true);
    for (const e of a.especialistas) expect(e.ok + e.mejorar + e.sinDatos).toBe(e.hallazgos.length);
  });

  it('cada hallazgo dice de dónde sale: temario o criterio propio, y lo bueno no lleva arreglo', () => {
    const todos = auditar(MAL).especialistas.flatMap((e) => e.hallazgos);
    expect(new Set(todos.map((h) => ETIQUETA_ORIGEN(h.fuente)))).toEqual(new Set(['Del temario', 'Criterio propio']));
    expect(ETIQUETA_ORIGEN('criterio-musica')).toBe('Criterio propio');
    expect(ETIQUETA_ORIGEN('ig-metricas')).toBe('Del temario');
    for (const h of auditar(base()).especialistas.flatMap((e) => e.hallazgos).filter((x) => x.estado === 'ok')) expect(h.arreglo).toBe('');
    for (const h of todos.filter((x) => x.estado !== 'ok')) expect(h.arreglo.length).toBeGreaterThan(0);
  });

  it('los ids no se repiten (la pantalla los usa de clave)', () => {
    const ids = auditar(base({ redes: ['instagram', 'tiktok', 'youtube'] })).especialistas.flatMap((e) => e.hallazgos.map((h) => h.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
