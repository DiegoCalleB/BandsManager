import { describe, it, expect } from 'vitest';
import { completitudDeSala, consultarSalas, fichaDeSala, leadDesdeSala, parsearFiltros, puntosDelMapa, salasEnAgenda, LIMITE_MAXIMO, MAX_PUNTOS_MAPA } from '../consultaCatalogo.js';
import type { SalaGuardada } from '../../services/catalogoSalas.js';

const sala = (o: Partial<SalaGuardada> & { id: string; nombre: string }): SalaGuardada => ({
  clave: `nc:${o.nombre.toLowerCase()}|madrid`,
  place_id: null,
  ciudad: 'Madrid',
  region: 'Comunidad de Madrid',
  direccion: 'Calle Falsa 1',
  tipo: 'sala',
  aforo: 300,
  genero: 'Rock / Ska',
  website: 'https://ejemplo.es/',
  instagram: null,
  email_contacto: 'booking@ejemplo.es',
  telefono: '910000000',
  nivel: 'sin_verificar',
  puntuacion: 10,
  verificada_en: null,
  bandas_con_respuesta: 0,
  bandas_con_entrega: 0,
  rebotes: 0,
  no_contactar: false,
  ...o,
});

const NADA = { ids: new Set<string>(), claves: new Set<string>() };
const filtros = (e: Record<string, unknown> = {}) => parsearFiltros(e);

describe('parsearFiltros', () => {
  it('acota el límite y normaliza el texto', () => {
    expect(filtros({ limite: 9999 }).limite).toBe(LIMITE_MAXIMO);
    expect(filtros({ limite: 'abc' }).limite).toBe(15);
    expect(filtros({ texto: '  Sála  Ñu ' }).texto).toBe('sala nu');
  });

  it('ignora lo que no es válido en vez de fallar', () => {
    const f = filtros({ nivelMinimo: 'dios', aforoMin: -5, aforoMax: 'x', tipo: ['sala'], texto: { a: 1 } });
    expect(f).toMatchObject({ nivelMinimo: 'sin_verificar', aforoMin: null, aforoMax: null, tipo: '', texto: '' });
  });

  it('acepta los nombres de query (snake_case y cadenas) y los de herramienta', () => {
    expect(filtros({ aforo_min: '200', con_contacto: 'true', nivel_minimo: 'probable' })).toMatchObject({ aforoMin: 200, conContacto: true, nivelMinimo: 'probable' });
  });
});

describe('consultarSalas', () => {
  const salas = [
    sala({ id: 'a', nombre: 'Alfa', nivel: 'sin_verificar', puntuacion: 15 }),
    sala({ id: 'b', nombre: 'Beta', nivel: 'probable', puntuacion: 55, ciudad: 'Bilbao', region: 'País Vasco', aforo: 800 }),
    sala({ id: 'c', nombre: 'Gamma', nivel: 'verificada', puntuacion: 80, genero: 'Reggae', tipo: 'festival', aforo: 5000 }),
    sala({ id: 'd', nombre: 'Delta', no_contactar: true, nivel: 'verificada', puntuacion: 99 }),
    sala({ id: 'e', nombre: 'Épsilon', email_contacto: null, telefono: null, aforo: null }),
  ];

  it('ordena por fiabilidad y nunca devuelve una sala «no contactar»', () => {
    const r = consultarSalas(salas, filtros(), NADA);
    expect(r.salas.map((s) => s.id)).toEqual(['c', 'b', 'a', 'e']);
    expect(r.total).toBe(4);
  });

  it('filtra por lugar (ciudad o región), tipo, género y aforo', () => {
    expect(consultarSalas(salas, filtros({ lugar: 'pais vasco' }), NADA).salas.map((s) => s.id)).toEqual(['b']);
    expect(consultarSalas(salas, filtros({ lugar: 'bilbao' }), NADA).salas.map((s) => s.id)).toEqual(['b']);
    expect(consultarSalas(salas, filtros({ tipo: 'festival' }), NADA).salas.map((s) => s.id)).toEqual(['c']);
    expect(consultarSalas(salas, filtros({ genero: 'reggae' }), NADA).salas.map((s) => s.id)).toEqual(['c']);
    expect(consultarSalas(salas, filtros({ aforoMin: 500, aforoMax: 1000 }), NADA).salas.map((s) => s.id)).toEqual(['b']);
  });

  it('un aforo desconocido no cumple un filtro de aforo', () => {
    expect(consultarSalas(salas, filtros({ aforoMin: 1 }), NADA).salas.map((s) => s.id)).not.toContain('e');
  });

  it('respeta el nivel mínimo y «solo con contacto»', () => {
    expect(consultarSalas(salas, filtros({ nivelMinimo: 'probable' }), NADA).salas.map((s) => s.id)).toEqual(['c', 'b']);
    expect(consultarSalas(salas, filtros({ conContacto: true }), NADA).salas.map((s) => s.id)).not.toContain('e');
  });

  it('busca por texto sin acentos en nombre, ciudad, región y género', () => {
    expect(consultarSalas(salas, filtros({ texto: 'epsilon' }), NADA).salas.map((s) => s.id)).toEqual(['e']);
    expect(consultarSalas(salas, filtros({ texto: 'vasco' }), NADA).salas.map((s) => s.id)).toEqual(['b']);
  });

  it('limita lo mostrado pero informa del total', () => {
    const r = consultarSalas(salas, filtros({ limite: 2 }), NADA);
    expect(r).toMatchObject({ total: 4, mostradas: 2 });
  });

  it('marca las que la banda ya tiene (por enlace o por nombre y ciudad) sin ocultarlas', () => {
    const agenda = salasEnAgenda([
      { sala_id: 'a', nombre_sala: 'x', ciudad: 'y' },
      { sala_id: null, nombre_sala: 'Gamma', ciudad: 'Madrid' },
    ]);
    const r = consultarSalas(salas, filtros(), agenda);
    expect(Object.fromEntries(r.salas.map((s) => [s.id, s.ya_en_agenda]))).toEqual({ c: true, b: false, a: true, e: false });
  });
});

describe('privacidad de la ficha', () => {
  it('no contiene email, teléfono ni nada de la sala que no deba verse (la dirección del local sí: es pública)', () => {
    const ficha = fichaDeSala(sala({ id: 'a', nombre: 'Alfa', place_id: 'ChIJxxx', rebotes: 3 }), false);
    const volcado = JSON.stringify(ficha);
    expect(volcado).not.toContain('booking@ejemplo.es');
    expect(volcado).not.toContain('910000000');
    expect(ficha.direccion).toBe('Calle Falsa 1');
    expect(volcado).not.toContain('ChIJxxx');
    expect(ficha).toMatchObject({ tiene_email: true, tiene_telefono: true });
    expect(Object.keys(ficha)).not.toContain('email_contacto');
    expect(Object.keys(ficha)).not.toContain('rebotes');
  });
});

describe('leadDesdeSala', () => {
  it('lleva el logo de la sala (el icono de su web) como imagen del lead', () => {
    expect(leadDesdeSala(sala({ id: 'a', nombre: 'Alfa', website: 'https://www.alfa.es/' }), 'l1', 'b1').imagen_url).toBe('https://www.google.com/s2/favicons?domain=alfa.es&sz=128');
    expect(leadDesdeSala(sala({ id: 'b', nombre: 'Beta', website: null }), 'l2', 'b1').imagen_url).toBeUndefined();
  });

  it('crea un lead de la banda con el contacto de la sala y sin pitch ni estado avanzado', () => {
    const lead = leadDesdeSala(sala({ id: 'a', nombre: 'Alfa', place_id: 'ChIJxxx' }), 'lead-cat-1', 'banda-1');
    expect(lead).toMatchObject({
      id: 'lead-cat-1',
      band_id: 'banda-1',
      nombre_sala: 'Alfa',
      email_contacto: 'booking@ejemplo.es',
      telefono: '910000000',
      place_id: 'ChIJxxx',
      estado: 'nuevo',
      fuente: 'Catálogo de salas',
    });
    expect(lead).not.toHaveProperty('pitch_generado');
    expect(lead).not.toHaveProperty('notas');
  });
});

describe('salas cerradas en Google Maps', () => {
  it('una cerrada que respondió a alguna banda no se oculta: sale con el aviso «posiblemente cerrada»', () => {
    const r = consultarSalas(
      [sala({ id: 'a', nombre: 'Cerrada sin contacto', estado_negocio: 'cerrado_permanente' }), sala({ id: 'b', nombre: 'Cerrada que respondió', estado_negocio: 'cerrado_permanente', bandas_con_respuesta: 1 })],
      filtros(),
      NADA,
    );
    expect(r.salas.map((s) => [s.id, s.posiblemente_cerrada])).toEqual([['b', true]]);
  });

  it('una sala cerrada definitivamente no sale en la consulta; una cerrada temporalmente sí', () => {
    const r = consultarSalas(
      [sala({ id: 'a', nombre: 'Abierta' }), sala({ id: 'b', nombre: 'Cerrada', estado_negocio: 'cerrado_permanente' }), sala({ id: 'c', nombre: 'Reforma', estado_negocio: 'cerrado_temporal' })],
      filtros(),
      NADA,
    );
    expect(r.salas.map((s) => s.id).sort()).toEqual(['a', 'c']);
  });
});

describe('completitud de la ficha', () => {
  it('cuenta los datos que importan a una banda y no se infla con una ficha vacía', () => {
    const vacia = sala({ id: 'v', nombre: 'Vacia', ciudad: null, direccion: null, website: null, instagram: null, email_contacto: null, telefono: null, aforo: null, genero: null });
    expect(completitudDeSala(vacia)).toBe(0);
    const completa = sala({ id: 'c', nombre: 'Completa', instagram: '@c', nivel: 'verificada', lat: 40.4, lon: -3.7 });
    expect(completitudDeSala(completa)).toBe(100);
  });

  it('el punto de la ciudad no cuenta como «situada» en la ficha', () => {
    const exacta = sala({ id: 'a', nombre: 'A', lat: 40.4, lon: -3.7 });
    const aprox = sala({ id: 'b', nombre: 'B', lat: 40.4, lon: -3.7, coordenadas_aprox: true });
    expect(completitudDeSala(exacta)).toBeGreaterThan(completitudDeSala(aprox));
  });

  it('la ficha lleva dónde está, la fuente y la completitud', () => {
    const ficha = fichaDeSala(sala({ id: 'a', nombre: 'Alfa', lat: 40.4, lon: -3.7, fuentes: ['osm'] }), false);
    expect(ficha).toMatchObject({ lat: 40.4, lon: -3.7, coordenadas_aprox: false, fuentes: ['osm'] });
    expect(ficha.completitud).toBeGreaterThan(0);
  });
});

describe('puntosDelMapa', () => {
  it('devuelve solo las salas situadas, con los mismos filtros que la lista, y cuenta cuántas faltan', () => {
    const salas = [
      sala({ id: 'a', nombre: 'Alfa', lat: 40.4, lon: -3.7 }),
      sala({ id: 'b', nombre: 'Beta' }),
      sala({ id: 'c', nombre: 'Gamma', ciudad: 'Lugo', region: 'Galicia', lat: 43, lon: -7.5, coordenadas_aprox: true }),
    ];
    const todas = puntosDelMapa(salas, filtros(), NADA);
    expect(todas.total).toBe(3);
    expect(todas.puntos.map((p) => p.id).sort()).toEqual(['a', 'c']);
    expect(todas.puntos.find((p) => p.id === 'c')?.coordenadas_aprox).toBe(true);
    const lugo = puntosDelMapa(salas, filtros({ lugar: 'Lugo' }), NADA);
    expect(lugo.puntos.map((p) => p.id)).toEqual(['c']);
  });

  it('marca las que la banda ya tiene y no enseña las «no contactar» ni las cerradas', () => {
    const salas = [
      sala({ id: 'a', nombre: 'Alfa', lat: 1, lon: 1 }),
      sala({ id: 'b', nombre: 'Beta', lat: 1, lon: 1, no_contactar: true }),
      sala({ id: 'c', nombre: 'Gamma', lat: 1, lon: 1, estado_negocio: 'cerrado_permanente' }),
    ];
    const r = puntosDelMapa(salas, filtros(), { ids: new Set(['a']), claves: new Set() });
    expect(r.puntos).toHaveLength(1);
    expect(r.puntos[0]).toMatchObject({ id: 'a', ya_en_agenda: true });
  });

  it('acota la respuesta y no lleva ni email ni teléfono', () => {
    const muchas = Array.from({ length: MAX_PUNTOS_MAPA + 5 }, (_, i) => sala({ id: `s${i}`, nombre: `Sala ${i}`, lat: 1, lon: 1 }));
    const r = puntosDelMapa(muchas, filtros(), NADA);
    expect(r.puntos).toHaveLength(MAX_PUNTOS_MAPA);
    expect(JSON.stringify(r.puntos[0])).not.toContain('booking@ejemplo.es');
  });
});

describe('aforo orientativo', () => {
  const salas = [
    sala({ id: 'a', nombre: 'Pequeña', aforo: 80 }),
    sala({ id: 'b', nombre: 'Mediana', aforo: 220 }),
    sala({ id: 'c', nombre: 'Grande', aforo: 900 }),
    sala({ id: 'd', nombre: 'Sin dato', aforo: null }),
  ];
  it('enseña las salas de la mitad a una vez y media el aforo pedido, y deja fuera las que no tienen aforo', () => {
    const r = consultarSalas(salas, filtros({ aforoAprox: '200' }), NADA);
    expect(r.salas.map((s) => s.id)).toEqual(['b']);
  });
  it('los extremos del margen entran', () => {
    const r = consultarSalas([sala({ id: 'x', nombre: 'X', aforo: 100 }), sala({ id: 'y', nombre: 'Y', aforo: 300 })], filtros({ aforoAprox: '200' }), NADA);
    expect(r.salas).toHaveLength(2);
  });
  it('sin aforo orientativo no filtra', () => {
    expect(consultarSalas(salas, filtros(), NADA).total).toBe(4);
  });
});
