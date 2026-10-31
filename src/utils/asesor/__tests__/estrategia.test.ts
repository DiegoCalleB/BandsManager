import { describe, expect, it } from 'vitest';
import { ESTRATEGIA_INICIAL, bloqueEstrategiaPrompt, sanearEstrategia } from '../estrategia';

describe('sanearEstrategia', () => {
  it('rechaza lo que no es un objeto', () => {
    expect(sanearEstrategia(null)).toBeNull();
    expect(sanearEstrategia([1])).toBeNull();
    expect(sanearEstrategia('x')).toBeNull();
  });

  it('cae a los valores por defecto ante enums inventados', () => {
    const e = sanearEstrategia({ objetivo: 'hackear', horasSemana: 40, camara: 'drones' })!;
    expect(e.objetivo).toBe(ESTRATEGIA_INICIAL.objetivo);
    expect(e.horasSemana).toBe(ESTRATEGIA_INICIAL.horasSemana);
    expect(e.camara).toBe(ESTRATEGIA_INICIAL.camara);
  });

  it('limpia, deduplica y recorta las listas', () => {
    const e = sanearEstrategia({ pilares: ['  Ensayos ', 'ensayos', 'La furgo', 'Letras', 'Sobra', 7] })!;
    expect(e.pilares).toEqual(['Ensayos', 'La furgo', 'Letras']);
  });

  it('quita caracteres de control y corta textos largos', () => {
    const e = sanearEstrategia({ publico: `hola\u0000\u0007 ${'x'.repeat(500)}` })!;
    expect(e.publico.startsWith('hola ')).toBe(true);
    expect(e.publico.length).toBe(300);
  });

  it('solo acepta un lanzamiento con título y fecha válida', () => {
    expect(sanearEstrategia({ lanzamiento: { titulo: 'Furgo', fecha: '2026-12-01' } })!.lanzamiento).toEqual({ titulo: 'Furgo', fecha: '2026-12-01' });
    expect(sanearEstrategia({ lanzamiento: { titulo: 'Furgo', fecha: 'mañana' } })!.lanzamiento).toBeNull();
    expect(sanearEstrategia({ lanzamiento: { titulo: '', fecha: '2026-12-01' } })!.lanzamiento).toBeNull();
  });

  it('solo marca como revisada con un true explícito', () => {
    expect(sanearEstrategia({ revisada: 'true' })!.revisada).toBe(false);
    expect(sanearEstrategia({ revisada: true })!.revisada).toBe(true);
  });
});

describe('bloqueEstrategiaPrompt', () => {
  it('envuelve los textos de la banda como datos y omite lo vacío', () => {
    const bloque = bloqueEstrategiaPrompt({ ...ESTRATEGIA_INICIAL, lineasRojas: ['bailes de trends'] });
    expect(bloque).toContain('<estrategia>');
    expect(bloque).toContain('Nunca proponer: bailes de trends');
    expect(bloque).not.toContain('Público:');
  });
});

describe('redes de la banda', () => {
  it('por defecto Instagram y TikTok; solo se aceptan redes conocidas, sin repetir y en orden fijo', () => {
    expect(ESTRATEGIA_INICIAL.redes).toEqual(['instagram', 'tiktok']);
    expect(sanearEstrategia({})!.redes).toEqual(['instagram', 'tiktok']);
    expect(sanearEstrategia({ redes: ['youtube', 'instagram', 'youtube', 'myspace', 7, null] })!.redes).toEqual(['instagram', 'youtube']);
    expect(sanearEstrategia({ redes: ['tiktok'] })!.redes).toEqual(['tiktok']);
  });

  it('sin ninguna red válida vuelve a las de serie, y lo viejo sin el campo sigue valiendo', () => {
    for (const redes of [[], ['facebook'], 'instagram', null, undefined, {}]) {
      expect(sanearEstrategia({ redes })!.redes).toEqual(['instagram', 'tiktok']);
    }
  });

  it('el prompt dice en qué redes están', () => {
    expect(bloqueEstrategiaPrompt({ ...ESTRATEGIA_INICIAL, redes: ['tiktok', 'youtube'] })).toContain('Redes: tiktok, youtube.');
  });
});

