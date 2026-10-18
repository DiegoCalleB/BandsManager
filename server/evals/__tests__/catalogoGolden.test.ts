import { describe, it, expect } from 'vitest';
import { evaluarCatalogo, CASOS_CLAVE, CASOS_NIVEL, CASOS_PRIVACIDAD } from '../catalogoGolden.js';

describe('banco de evaluación del catálogo de salas', () => {
  const r = evaluarCatalogo();

  it('no aparecen fallos nuevos (cada fallo conocido lleva su motivo)', () => {
    expect(r.fallos.filter((f) => !f.conocido), JSON.stringify(r.fallos)).toEqual([]);
  });

  it('los fallos conocidos siguen fallando: si uno se arregla, hay que quitarle la marca', () => {
    const conocidos = [...CASOS_CLAVE, ...CASOS_NIVEL, ...CASOS_PRIVACIDAD].filter((c) => c.conocido).map((c) => c.id);
    expect(conocidos.filter((id) => !r.fallos.some((f) => f.id === id))).toEqual([]);
  });

  it('privacidad sin un solo fallo, y ninguna falsa fusión: son las promesas que no admiten error', () => {
    expect(r.porBloque.privacidad.aciertos).toBe(r.porBloque.privacidad.total);
    // Un duplicado sin fusionar es aceptable (hay casos «conocidos»); dos salas distintas fusionadas, nunca.
    expect(r.fallos.filter((f) => f.id.startsWith('dif-'))).toEqual([]);
  });

  it('los ids son únicos', () => {
    const ids = [...CASOS_CLAVE, ...CASOS_NIVEL, ...CASOS_PRIVACIDAD].map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
