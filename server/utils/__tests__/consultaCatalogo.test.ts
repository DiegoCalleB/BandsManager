import { describe, it, expect } from 'vitest';
import { consultarSalas, fichaDeSala, leadDesdeSala, parsearFiltros, salasEnAgenda, LIMITE_MAXIMO } from '../consultaCatalogo.js';
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
  it('no contiene email, teléfono, dirección exacta ni nada de la sala que no deba verse', () => {
    const ficha = fichaDeSala(sala({ id: 'a', nombre: 'Alfa', place_id: 'ChIJxxx', rebotes: 3 }), false);
    const volcado = JSON.stringify(ficha);
    expect(volcado).not.toContain('booking@ejemplo.es');
    expect(volcado).not.toContain('910000000');
    expect(volcado).not.toContain('Calle Falsa');
    expect(volcado).not.toContain('ChIJxxx');
    expect(ficha).toMatchObject({ tiene_email: true, tiene_telefono: true });
    expect(Object.keys(ficha)).not.toContain('email_contacto');
    expect(Object.keys(ficha)).not.toContain('rebotes');
  });
});

describe('leadDesdeSala', () => {
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
